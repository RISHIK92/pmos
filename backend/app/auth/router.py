from fastapi import APIRouter
from app.auth.schema import RegisterRequest, RegisterResponse, LoginRequest, LoginResponse
from app.auth.controller import AuthController

router = APIRouter(prefix="/auth", tags=["Authentication"])
controller = AuthController()

@router.post("/register", response_model=RegisterResponse)
async def register(request: RegisterRequest):
    registerUser = await controller.register(request)
    return registerUser