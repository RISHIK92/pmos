from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
from app.health.service import HealthService
from common.security import verify_token
from prisma.models import User
from services.db import db
from datetime import datetime, timezone, timedelta
import json

router = APIRouter()
service = HealthService()

class SyncStepsRequest(BaseModel):
    date: str # YYYY-MM-DD
    steps: int
    hourlyData: Dict[str, int]

class UpdateHydrationRequest(BaseModel):
    date: str
    amount: int


class HealthLogResponse(BaseModel):
    date: str
    steps: int
    hourlyData: Optional[str]

@router.post("/sync")
async def sync_steps(request: SyncStepsRequest, user: User = Depends(verify_token)):
    try:
        log = await service.upsert_daily_log(
            user_id=user['uid'],
            date=request.date,
            steps=request.steps,
            hourly_data=request.hourlyData
        )
        return {"success": True, "log": log}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/hydration")
async def update_hydration(request: UpdateHydrationRequest, user: User = Depends(verify_token)):
    try:
        log = await service.update_hydration(
            user_id=user['uid'],
            date=request.date,
            amount=request.amount
        )
        return {"success": True, "log": log}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -----------------------------------------------------------
# SLEEP ROUTES (Merged)
# -----------------------------------------------------------

@router.post("/sleep/start")
async def start_sleep(user: User = Depends(verify_token)):
    try:
        # Find 'Sleep' goal
        goal = await db.goal.find_unique(where={'userId_title': {'userId': user['uid'], 'title': 'Sleep'}})
        if not goal:
            goal = await db.goal.create(data={
                'userId': user['uid'],
                'title': 'Sleep',
                'target': 8 * 60, # 8 hours
                'unit': 'min',
                'icon': 'moon.fill',
                'isSystem': True,
                'category': 'health'
            })

        today = datetime.now().strftime('%Y-%m-%d')
        
        # Fetch log
        glog = await db.goallog.find_unique(where={'goalId_date': {'goalId': goal.id, 'date': today}})
        
        current_extra = {}
        if glog and glog.extraData:
            try:
                current_extra = json.loads(glog.extraData)
            except:
                current_extra = {}
        
        # Set start time
        current_extra['sessionStart'] = datetime.now(timezone.utc).isoformat()
        current_extra['isSleeping'] = True
        
        if glog:
            await db.goallog.update(
                where={'id': glog.id},
                data={'extraData': json.dumps(current_extra)}
            )
        else:
             await db.goallog.create(data={
                 'userId': user['uid'],
                 'goalId': goal.id,
                 'date': today,
                 'current': 0,
                 'extraData': json.dumps(current_extra)
             })

        return {
            "success": True, 
            "message": "Sleep tracking started"
        }
    except Exception as e:
        print(f"Error starting sleep: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sleep/end")
async def end_sleep(user = Depends(verify_token)):
    try:
        goal = await db.goal.find_unique(where={'userId_title': {'userId': user['uid'], 'title': 'Sleep'}})
        if not goal:
            raise HTTPException(status_code=404, detail="Sleep goal not found")

        # Find active session (check yesterday then today)
        today = datetime.now()
        yesterday = today - timedelta(days=1)
        
        today_str = today.strftime('%Y-%m-%d')
        yesterday_str = yesterday.strftime('%Y-%m-%d')
        
        active_log = None
        active_extra = {}
        
        # Check yesterday first
        log_y = await db.goallog.find_unique(where={'goalId_date': {'goalId': goal.id, 'date': yesterday_str}})
        if log_y and log_y.extraData:
            try:
                d = json.loads(log_y.extraData)
                if d.get('isSleeping'):
                    active_log = log_y
                    active_extra = d
            except:
                pass
        
        # If not found, check today
        if not active_log:
            log_t = await db.goallog.find_unique(where={'goalId_date': {'goalId': goal.id, 'date': today_str}})
            if log_t and log_t.extraData:
                try:
                    d = json.loads(log_t.extraData)
                    if d.get('isSleeping'):
                        active_log = log_t
                        active_extra = d
                except:
                    pass
        
        if not active_log or not active_extra.get('sessionStart'):
             return {"success": False, "message": "No active sleep session found"}
             
        # Calculate duration
        start_time = datetime.fromisoformat(active_extra['sessionStart'])
        end_time = datetime.now(timezone.utc)
        
        if start_time.tzinfo is None:
            start_time = start_time.replace(tzinfo=timezone.utc)
            
        duration_minutes = int((end_time - start_time).total_seconds() / 60)
        
        # Attribute to WAKE UP DAY (today_str)
        target_date_str = today_str
        
        # 1. Update/Create Target Log (Log where we store the COMPLETED session)
        target_log = await db.goallog.find_unique(where={'goalId_date': {'goalId': goal.id, 'date': target_date_str}})
        
        target_extra = {}
        target_current = 0
        
        if target_log:
            target_current = target_log.current
            if target_log.extraData:
                try:
                    target_extra = json.loads(target_log.extraData)
                except:
                    pass
        
        # Append session to target
        sessions = target_extra.get('sessions', [])
        sessions.append({
            'start': active_extra['sessionStart'],
            'end': end_time.isoformat(),
            'duration': duration_minutes
        })
        target_extra['sessions'] = sessions
        target_current += duration_minutes
        
        # If target log is same as active log (slept and woke same day), ensure we clear isSleeping
        if active_log.date == target_date_str:
            target_extra['isSleeping'] = False
            if 'sessionStart' in target_extra:
                del target_extra['sessionStart']
                
        # Save Target Log
        await db.goallog.upsert(
            where={'goalId_date': {'goalId': goal.id, 'date': target_date_str}},
            data={
                'create': {
                    'userId': user['uid'], 
                    'goalId': goal.id, 
                    'date': target_date_str, 
                    'current': duration_minutes,
                    'extraData': json.dumps(target_extra)
                },
                'update': {
                    'current': target_current,
                    'extraData': json.dumps(target_extra)
                }
            }
        )
        
        # 2. If Active Log was DIFFERENT (slept yesterday), Clean up Active Log
        if active_log.date != target_date_str:
            # We need to remove isSleeping and sessionStart from yesterday's log
            # But KEEP its sessions/current (if any existed before sleep started)
            active_extra['isSleeping'] = False
            if 'sessionStart' in active_extra:
                del active_extra['sessionStart']
            
            await db.goallog.update(
                where={'id': active_log.id},
                data={'extraData': json.dumps(active_extra)}
            )

        return {
            "success": True,
            "duration": duration_minutes,
            "message": f"Woke up! You slept for {duration_minutes} minutes."
        }
        
    except Exception as e:
        print(f"Error ending sleep: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sleep/daily")
async def get_daily_sleep(date: str, user = Depends(verify_token)):
    try:
        goal = await db.goal.find_unique(where={'userId_title': {'userId': user['uid'], 'title': 'Sleep'}})
        if not goal:
            return []
            
        logs = []
        
        # 1. Fetch requested date's log for COMPLETED sessions
        glog = await db.goallog.find_unique(where={'goalId_date': {'goalId': goal.id, 'date': date}})
        
        is_sleeping_today = False
        
        if glog and glog.extraData:
            try:
                data = json.loads(glog.extraData)
                sessions = data.get('sessions', [])
                
                for idx, s in enumerate(sessions):
                    logs.append({
                        'id': f"{glog.id}_{idx}",
                        'startTime': s['start'],
                        'endTime': s['end'],
                        'duration': s['duration']
                    })
                
                # Check for active session starting TODAY
                if data.get('isSleeping') and data.get('sessionStart'):
                     is_sleeping_today = True
                     logs.append({
                         'id': 'current_active',
                         'startTime': data['sessionStart'],
                         'endTime': None,
                         'duration': 0
                     })
            except:
                pass
        
        # 2. If no active session found on requested date AND requested date is TODAY,
        # check YESTERDAY for an active crossover session.
        today_str = datetime.now().strftime('%Y-%m-%d')
        if date == today_str and not is_sleeping_today:
            yesterday_str = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
            glog_y = await db.goallog.find_unique(where={'goalId_date': {'goalId': goal.id, 'date': yesterday_str}})
            if glog_y and glog_y.extraData:
                try:
                    data_y = json.loads(glog_y.extraData)
                    if data_y.get('isSleeping') and data_y.get('sessionStart'):
                         logs.append({
                             'id': 'current_active_carryover',
                             'startTime': data_y['sessionStart'],
                             'endTime': None,
                             'duration': 0
                         })
                except:
                    pass

        # Reverse to show latest first
        return logs[::-1]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_history(start_date: str, end_date: str, user: User = Depends(verify_token)):
    try:
        logs = await service.get_history(user['uid'], start_date, end_date)
        return {"success": True, "data": logs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard")
async def get_dashboard(date: str, user: User = Depends(verify_token)):
    try:
        data = await service.get_daily_dashboard(user['uid'], date)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class GoalDetailsRequest(BaseModel):
    goalIds: List[str]
    includeLogs: bool = True

@router.post("/goals/details")
async def get_goal_details(request: GoalDetailsRequest, user: User = Depends(verify_token)):
    try:
        data = await service.get_goal_details(user['uid'], request.goalIds, request.includeLogs)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
