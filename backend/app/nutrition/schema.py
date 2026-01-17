from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class MealItemBase(BaseModel):
    name: str
    kcal: int
    time: str
    type: str # "Breakfast", "Lunch", "Dinner", "Snack"

class MealItemCreate(MealItemBase):
    date: str # "YYYY-MM-DD" of the log to attach to

class MealItemUpdate(BaseModel):
    name: Optional[str] = None
    kcal: Optional[int] = None
    time: Optional[str] = None
    type: Optional[str] = None

class MealItemResponse(MealItemBase):
    id: str
    dailyLogId: str
    createdAt: datetime
    
    class Config:
        from_attributes = True

class DailyLogBase(BaseModel):
    date: str
    goal: int

class DailyLogResponse(DailyLogBase):
    id: str
    userId: str
    meals: List[MealItemResponse]

    class Config:
        from_attributes = True
