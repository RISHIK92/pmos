from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
from app.health.service import HealthService
from common.security import verify_token
from prisma.models import User

router = APIRouter()
service = HealthService()

class SyncStepsRequest(BaseModel):
    date: str # YYYY-MM-DD
    steps: int
    hourlyData: Dict[str, int]

class HealthLogResponse(BaseModel):
    date: str
    steps: int
    hourlyData: Optional[str]

@router.post("/sync")
async def sync_steps(request: SyncStepsRequest, user: User = Depends(verify_token)):
    try:
        log = await service.upsert_daily_log(
            user_id=user.id,
            date=request.date,
            steps=request.steps,
            hourly_data=request.hourlyData
        )
        return {"success": True, "log": log}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_history(start_date: str, end_date: str, user: User = Depends(verify_token)):
    try:
        logs = await service.get_history(user['uid'], start_date, end_date)
        return {"success": True, "data": logs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
