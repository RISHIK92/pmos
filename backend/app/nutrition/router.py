from fastapi import APIRouter, Depends, HTTPException
from typing import List, Any
from core.lifespan import db
from common.security import verify_token
from .schema import MealItemCreate, MealItemUpdate, MealItemResponse
from . import service

router = APIRouter(prefix="/nutrition", tags=["Nutrition"])

@router.get("/history")
async def get_history(user: dict = Depends(verify_token)):
    # Returns last 7 days logs
    return await service.get_weekly_logs(user["uid"], db)

@router.post("/meals", response_model=MealItemResponse)
async def create_meal(meal: MealItemCreate, user: dict = Depends(verify_token)):
    return await service.add_meal(user["uid"], meal, db)

@router.put("/meals/{meal_id}", response_model=MealItemResponse)
async def update_meal(meal_id: str, meal: MealItemUpdate, user: dict = Depends(verify_token)):
    # In a real app, verify user owns the meal
    return await service.update_meal(user["uid"], meal_id, meal, db)

@router.delete("/meals/{meal_id}")
async def delete_meal(meal_id: str, user: dict = Depends(verify_token)):
    await service.delete_meal(user["uid"], meal_id, db)
    return {"success": True}
