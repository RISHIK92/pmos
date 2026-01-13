from fastapi.param_functions import Depends
from fastapi import APIRouter
from app.auth.schema import RegisterResponse
from app.auth.controller import AuthController
from common.security import verify_token

router = APIRouter(prefix="/auth", tags=["Authentication"])
controller = AuthController()

@router.post("/register", response_model=RegisterResponse)
async def register(user_data: dict = Depends(verify_token)):
    registerUser = await controller.register(user_data)
    return registerUser