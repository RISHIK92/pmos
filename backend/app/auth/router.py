from fastapi.param_functions import Depends
from fastapi import APIRouter
from app.auth.schema import RegisterResponse, RegisterRequest
from app.auth.controller import AuthController
from common.security import verify_token

router = APIRouter(prefix="/auth", tags=["Authentication"])
controller = AuthController()

@router.post("/register", response_model=RegisterResponse)
async def register(request: RegisterRequest = None, user_data: dict = Depends(verify_token)):
    fcm_token = request.fcmToken if request else None
    registerUser = await controller.register(user_data, fcm_token)
    return registerUser