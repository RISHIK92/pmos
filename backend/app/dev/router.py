from fastapi import APIRouter, Depends, HTTPException
from app.dev.service import DevService
from app.dev.schema import DevProfile
from common.security import verify_token

router = APIRouter(prefix="/dev", tags=["Developer"])
service = DevService()

@router.get("/profile", response_model=DevProfile)
async def get_developer_profile(user_data: dict = Depends(verify_token), timezone_offset: int = 0):
    try:
        profile = await service.get_profile(user_data["uid"], timezone_offset)
        return profile
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
