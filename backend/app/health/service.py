from services.db import db
import json
from datetime import datetime, timedelta

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
            step_goal = await db.goal.find_unique(where={'userId_title': {'userId': user_id, 'title': 'Daily Steps'}})
            water_goal = await db.goal.find_unique(where={'userId_title': {'userId': user_id, 'title': 'Hydration'}})
            sleep_goal = await db.goal.find_unique(where={'userId_title': {'userId': user_id, 'title': 'Sleep'}})
            cal_goal = await db.goal.find_unique(where={'userId_title': {'userId': user_id, 'title': 'Calories'}})
            
            step_logs = []
            water_logs = []
            sleep_logs = []
            cal_logs = []
            
            if step_goal:
                step_logs = await db.goallog.find_many(where={'goalId': step_goal.id, 'date': {'gte': start_date, 'lte': end_date}})
            
            if water_goal:
                water_logs = await db.goallog.find_many(where={'goalId': water_goal.id, 'date': {'gte': start_date, 'lte': end_date}})

            if sleep_goal:
                sleep_logs = await db.goallog.find_many(where={'goalId': sleep_goal.id, 'date': {'gte': start_date, 'lte': end_date}})

            if cal_goal:
                cal_logs = await db.goallog.find_many(where={'goalId': cal_goal.id, 'date': {'gte': start_date, 'lte': end_date}})
                
            # Merge logic
            history = {}
            # Helper to init dict
            def get_day(d):
                if d not in history: history[d] = {'date': d, 'steps': 0, 'waterIntake': 0, 'sleepDuration': 0, 'calories': 0}
                return history[d]

            for l in step_logs: get_day(l.date)['steps'] = l.current
            for l in water_logs: get_day(l.date)['waterIntake'] = l.current
            for l in sleep_logs: get_day(l.date)['sleepDuration'] = l.current
            for l in cal_logs: get_day(l.date)['calories'] = l.current
                
            return sorted(list(history.values()), key=lambda x: x['date'])

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
            
            # 1. Process standard goals (Steps, Sleep, Hydration stored in GoalLog)
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
                
                # Special handling for Calories if it exists as a Goal, 
                # we might want to override current with actual meal sum later.
                # For now, let's just add it.
                
                results.append({
                    "id": g.id,
                    "title": g.title,
                    "target": g.target,
                    "unit": g.unit,
                    "icon": g.icon,
                    "current": int(log.current) if log else 0,
                    "category": g.category
                })

            # 2. Inject Nutrition (Calories) from DailyLog
            # Check if we already have a Calories goal in results
            cal_index = next((i for i, x in enumerate(results) if x["title"] == "Calories"), -1)
            
            # Fetch Daily Log with Meals
            daily_log = await db.dailylog.find_unique(
                where={
                    'userId_date': {
                        'userId': user_id,
                        'date': date
                    }
                },
                include={'meals': True}
            )
            
            current_cals = 0
            target_cals = 2000 # Default
            
            if daily_log:
                current_cals = sum([m.kcal for m in daily_log.meals])
                target_cals = daily_log.goal
                
            if cal_index != -1:
                # Update existing goal entry with actual nutrition data
                results[cal_index]["current"] = current_cals
                # results[cal_index]["target"] = target_cals # Optional: if we want to sync target from DailyLog
            else:
                # Add synthetic goal item for Dashboard
                results.append({
                    "id": "nutrition_cals",
                    "title": "Calories",
                    "target": target_cals,
                    "unit": "kcal",
                    "icon": "flame.fill",
                    "current": current_cals,
                    "category": "health"
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

    async def update_gender(self, user_id: str, gender: str):
        try:
            await db.user.update(
                where={'id': user_id},
                data={'gender': gender}
            )
            return True
        except Exception as e:
            print(f"Error updating gender: {e}")
            return False

    async def log_period(self, user_id: str, date: str):
        try:
            # Check if cycle already exists for this start date
            existing = await db.periodcycle.find_first(
                where={
                    'userId': user_id,
                    'startDate': date
                }
            )
            if existing:
                return existing
            
            cycle = await db.periodcycle.create(
                data={
                    'userId': user_id,
                    'startDate': date
                }
            )
            return cycle
        except Exception as e:
            print(f"Error logging period: {e}")
            raise e

    async def get_period_data(self, user_id: str):
        try:
            # Get User Gender
            user = await db.user.find_unique(where={'id': user_id})
            if not user: return None
            
            # Fetch last 3 cycles for history
            cycles = await db.periodcycle.find_many(
                where={'userId': user_id},
                order={'startDate': 'desc'},
                take=3
            )
            
            prediction = None
            days_late = 0
            is_late = False
            last_date = None
            
            if cycles:
                last_cycle = cycles[0]
                last_start = datetime.strptime(last_cycle.startDate, "%Y-%m-%d")
                last_date = last_cycle.startDate
                
                # Predict next (Standard 28 days)
                next_date = last_start + timedelta(days=28)
                prediction = next_date.strftime("%Y-%m-%d")
                
                # Check status
                today = datetime.now()
                # Variance logic: if today > prediction, start counting late
                if today > next_date:
                    delta = today - next_date
                    days_late = delta.days
                    is_late = True
                    
                # Check for "Missed" logic > 40 days since last period
                # (Today - Last Start) > 40
                days_since_last = (today - last_start).days
                if days_since_last > 40:
                    is_late = True # Definitely late/missed
            
            return {
                "gender": user.gender,
                "history": cycles,
                "lastPeriodDate": last_date,
                "nextPeriodDate": prediction,
                "isLate": is_late,
                "daysLate": days_late
            }
            
        except Exception as e:
            print(f"Error getting period data: {e}")
            return None