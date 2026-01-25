from prisma import Prisma
from typing import List, Dict, Any
from datetime import datetime, timedelta
from .schema import MealItemCreate, MealItemUpdate

async def get_weekly_logs(user_id: str, db: Prisma) -> List[Dict[str, Any]]:
    today = datetime.now()
    dates = []
    days_short = ["S", "M", "T", "W", "T", "F", "S"] 
    
    for i in range(6, -1, -1):
       d = today - timedelta(days=i)
       dates.append(d)

    date_strings = [d.strftime("%Y-%m-%d") for d in dates]
    
    # 2. Fetch logs from DB
    logs = await db.dailylog.find_many(
        where={
            "userId": user_id,
            "date": {"in": date_strings}
        },
        include={"meals": True}
    )
    
    logs_map = {log.date: log for log in logs}
    
    result = []
    for d in dates:
        date_str = d.strftime("%Y-%m-%d")
        log = logs_map.get(date_str)
        
        day_index = int(d.strftime("%w")) # 0=Sunday
        day_char = days_short[day_index]
        
        if log:
            # We have data
            result.append({
                "id": log.id,
                "date": date_str, # DB date key
                "day": day_char,
                "displayDate": str(d.day), # "15"
                "fullDate": d,
                "goal": log.goal,
                "meals": log.meals # List[MealItem]
            })
        else:
            # Empty filler
            result.append({
                "id": None, # No DB entry yet
                "userId": user_id,
                "date": date_str,
                "day": day_char,
                "displayDate": str(d.day),
                "fullDate": d,
                "goal": 2200,
                "meals": []
            })
            
    return result

async def add_meal(user_id: str, meal_data: MealItemCreate, db: Prisma):
    # 1. Find or create DailyLog
    log = await db.dailylog.find_unique(
        where={
            "userId_date": {"userId": user_id, "date": meal_data.date}
        }
    )
    
    if not log:
        log = await db.dailylog.create(
            data={
                "userId": user_id,
                "date": meal_data.date,
                "goal": 2200
            }
        )
        
    # 2. Add Meal
    new_meal = await db.mealitem.create(
        data={
            "dailyLogId": log.id,
            "name": meal_data.name,
            "kcal": meal_data.kcal,
            "time": meal_data.time,
            "type": meal_data.type
        }
    )
    
    return new_meal

async def update_meal(user_id: str, meal_id: str, meal_data: MealItemUpdate, db: Prisma):
    
    return await db.mealitem.update(
        where={"id": meal_id},
        data={k: v for k, v in meal_data.dict(exclude_unset=True).items()}
    )

async def delete_meal(user_id: str, meal_id: str, db: Prisma):
    return await db.mealitem.delete(
        where={"id": meal_id}
    )
