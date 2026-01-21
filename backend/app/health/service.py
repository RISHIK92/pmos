from services.db import db
import json
from datetime import datetime

class HealthService:
    async def get_or_create_goal_log(self, user_id: str, date: str, goal_title: str):
        # 1. Get Goal ID
        goal = await db.goal.find_unique(
            where={
                'userId_title': {
                    'userId': user_id,
                    'title': goal_title
                }
            }
        )
        if not goal:
            # Try creating system goal if missing (fallback)
            pass
            return None
            
        # 2. Get/Create Log
        log = await db.goallog.find_unique(
            where={
                'goalId_date': {
                    'goalId': goal.id,
                    'date': date
                }
            }
        )
        
        if not log:
            log = await db.goallog.create(
                data={
                    'userId': user_id,
                    'goalId': goal.id,
                    'date': date,
                    'current': 0
                }
            )
            
        return log

    async def upsert_daily_log(self, user_id: str, date: str, steps: int, hourly_data: any):
        try:
            # 1. Update Goal: "Daily Steps"
            log = await self.get_or_create_goal_log(user_id, date, "Daily Steps")
            if log:
                await db.goallog.update(
                    where={'id': log.id},
                    data={
                        'current': steps,
                        'extraData': json.dumps(hourly_data)
                    }
                )
            
            return {"date": date, "steps": steps, "hourlyData": hourly_data}

        except Exception as e:
            print(f"Error in upsert_daily_log: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            raise


    async def update_hydration(self, user_id: str, date: str, amount: int):
        try:
            # Update Goal: "Hydration"
            log = await self.get_or_create_goal_log(user_id, date, "Hydration")
            if log:
                await db.goallog.update(
                    where={'id': log.id},
                    data={'current': amount}
                )

            return {"date": date, "waterIntake": amount}
        except Exception as e:
            print(f"Error in update_hydration: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

    async def get_history(self, user_id: str, start_date: str, end_date: str):
        try:
            # Fetch Step Logs
            step_goal = await db.goal.find_unique(where={'userId_title': {'userId': user_id, 'title': 'Daily Steps'}})
            water_goal = await db.goal.find_unique(where={'userId_title': {'userId': user_id, 'title': 'Hydration'}})
            
            step_logs = []
            water_logs = []
            
            if step_goal:
                step_logs = await db.goallog.find_many(
                    where={
                        'goalId': step_goal.id,
                        'date': {'gte': start_date, 'lte': end_date}
                    }
                )

            if water_goal:
                water_logs = await db.goallog.find_many(
                    where={
                        'goalId': water_goal.id,
                        'date': {'gte': start_date, 'lte': end_date}
                    }
                )
                
            # Merge logic
            history = {}
            for l in step_logs:
                if l.date not in history: history[l.date] = {'date': l.date, 'steps': 0, 'waterIntake': 0}
                history[l.date]['steps'] = l.current
                
            for l in water_logs:
                if l.date not in history: history[l.date] = {'date': l.date, 'steps': 0, 'waterIntake': 0}
                history[l.date]['waterIntake'] = l.current
                
            return list(history.values())

        except Exception as e:
            print(f"Error checking history: {str(e)}")
            return []

    async def get_daily_dashboard(self, user_id: str, date: str):
        try:
            # Fetch all system goals for the user
            goals = await db.goal.find_many(
                where={'userId': user_id}
            )
            
            results = []
            for g in goals:
                # Get log for today
                log = await db.goallog.find_unique(
                    where={
                        'goalId_date': {
                            'goalId': g.id,
                            'date': date
                        }
                    }
                )
                
                results.append({
                    "id": g.id,
                    "title": g.title,
                    "target": g.target,
                    "unit": g.unit,
                    "icon": g.icon,
                    "current": log.current if log else 0,
                    "category": g.category
                })
                
            return results

        except Exception as e:
            print(f"Error getting dashboard: {str(e)}")
            import traceback
            traceback.print_exc()
            return []

    async def get_goal_details(self, user_id: str, goal_ids: list[str], include_logs: bool = True):
        try:
            query_args = {
                'where': {
                    'userId': user_id,
                    'id': {'in': goal_ids}
                }
            }
            
            if include_logs:
                query_args['include'] = {'logs': True}
                
            goals = await db.goal.find_many(**query_args)
            return goals
        except Exception as e:
            print(f"Error getting goal details: {str(e)}")
            return []