from fastapi import APIRouter, Depends, HTTPException
from typing import List
from common.security import verify_token
from app.focus.controller import FocusController
from app.focus.schema import FocusSessionCreate, FocusSessionResponse

router = APIRouter(prefix="/focus", tags=["focus"])
controller = FocusController()

@router.get("/history", response_model=List[FocusSessionResponse])
async def get_history(user_data: dict = Depends(verify_token)):
    return await controller.get_history(user_data)

@router.post("/session", response_model=FocusSessionResponse)
async def create_session(data: FocusSessionCreate, user_data: dict = Depends(verify_token)):
    return await controller.create_session(data, user_data)
