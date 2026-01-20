from services.db import db
import json
from datetime import datetime

class HealthService:
    async def upsert_daily_log(self, user_id: str, date: str, steps: int, hourly_data: any):
        """
        Upsert a daily health log.
        If it exists, we update the steps and hourly data.
        """
        # Ensure hourly_data is a valid JSON string
        date_obj = datetime.strptime(date, '%Y-%m-%d')
        hourly_json = json.dumps(hourly_data)
        
        return await db.DailyHealthLog.upsert(
            where={
                'userId_date': {
                    'userId': user_id,
                    'date': date_obj
                }
            },
            data={
                'create': {
                    'userId': user_id,
                    'date': date,
                    'steps': steps,
                    'hourlyData': hourly_json
                },
                'update': {
                    'steps': steps,
                    'hourlyData': hourly_json
                }
            }
        )

    async def get_history(self, user_id: str, start_date: str, end_date: str):
        try:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            end_dt = datetime.strptime(end_date, '%Y-%m-%d')
            
            print(user_id, "uid", start_dt, type(start_dt), end_dt, type(end_dt))
            
            result = await db.dailyhealthlog.find_many(
                where={
                    'userId': user_id,
                    'date': {
                        'gte': start_dt,
                        'lte': end_dt
                    }
                },
                order={
                    'date': 'asc'
                }
            )
            return result
        except Exception as e:
            print(f"Error in get_history: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            raise