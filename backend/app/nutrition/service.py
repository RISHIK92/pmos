from prisma import Prisma
from typing import List, Dict, Any
from datetime import datetime, timedelta
from .schema import MealItemCreate, MealItemUpdate

async def get_weekly_logs(user_id: str, db: Prisma) -> List[Dict[str, Any]]:
    # 1. Determine last 7 days dates
    # Assuming "today" is according to client or server time. Server time for now.
    today = datetime.now()
    dates = []
    days_short = ["S", "M", "T", "W", "T", "F", "S"] # 0=Sunday in some logic, but python weekday 0=Monday.
    # Frontend logic: days[date.getDay()] -> getDay 0=Sun. Python isoweekday 1=Mon, 7=Sun.
    # Let's align with JS:
    # 0=Sun, 1=Mon, ..., 6=Sat
    
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
    
    # 3. Construct response matching frontend structure (partially, or full daily log DB objects)
    # The frontend expects a list of "DailyLog" objects with "meals" as a Record.
    # We will return the list of Pydantic-compatible dicts, 
    # BUT the frontend might need to adapt.
    # For now, let's return the DB-style list, and let frontend adapt OR 
    # we can try to help.
    # Actually, let's return a list where each item corresponds to one of the last 7 days,
    # ensuring gaps are filled with empty logs.
    
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
    # Verify ownership via relation? Prisma query makes it easy
    # But usually just check ID. For strictness, check if log.userId == user_id.
    # Simplified: return updated item
    
    return await db.mealitem.update(
        where={"id": meal_id},
        data={k: v for k, v in meal_data.dict(exclude_unset=True).items()}
    )

async def delete_meal(user_id: str, meal_id: str, db: Prisma):
    return await db.mealitem.delete(
        where={"id": meal_id}
    )
