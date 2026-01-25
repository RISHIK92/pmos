from fastapi import APIRouter, Depends, HTTPException
from typing import List, Any
from core.lifespan import db
from common.security import verify_token
from app.nutrition.schema import (
    DailyLogResponse,
    MealItemCreate,
    MealItemResponse,
    MealItemUpdate,
    MealAnalyzeRequest
)
from app.nutrition import service
from app.chains.food_analyzer import analyze_food_image
from types import SimpleNamespace

router = APIRouter(prefix="/nutrition", tags=["Nutrition"])

@router.post("/analyze")
async def analyze_meal(request: MealAnalyzeRequest):
    if not request.image:
        raise HTTPException(status_code=400, detail="Image required")

    result = await analyze_food_image(request.image)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to analyze image")

    return result

@router.get("/history", response_model=List[DailyLogResponse])
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
