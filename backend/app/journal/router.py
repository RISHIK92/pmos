from fastapi import APIRouter, Depends, HTTPException, Query
from app.journal.service import JournalService
from app.journal.schema import JournalRequest, JournalResponse
from common.security import verify_token
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/journal", tags=["Journal"])
service = JournalService()

@router.get("/today", response_model=Optional[JournalResponse])
async def get_today_journal(
    date: str = Query(..., description="Date in YYYY-MM-DD format"), 
    type: str = Query("PERSONAL", description="Journal Type (PERSONAL/DEV)"),
    user_data: dict = Depends(verify_token)
):
    try:
        # Validate date format?
        return await service.get_journal_today(user_data["uid"], date, type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history", response_model=list[JournalResponse])
async def get_journal_history(
    type: str = Query("PERSONAL", description="Journal Type (PERSONAL/DEV)"),
    limit: int = Query(10, description="Number of entries to fetch"),
    user_data: dict = Depends(verify_token)
):
    try:
        return await service.get_history(user_data["uid"], type, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=JournalResponse)
async def upsert_journal(req: JournalRequest, user_data: dict = Depends(verify_token)):
    try:
        return await service.upsert_journal(user_data["uid"], req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
async def delete_journal(id: str, user_data: dict = Depends(verify_token)):
    success = await service.delete_journal(user_data["uid"], id)
    if not success:
        raise HTTPException(status_code=404, detail="Journal not found or access denied")
    return {"status": "deleted"}
