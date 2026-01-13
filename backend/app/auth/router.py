from fastapi import APIRouter
from auth.schema import RegisterRequest, RegisterResponse, LoginRequest, LoginResponse
from auth.controller import AuthController

router = APIRouter(prefix="/auth", tags=["Authentication"])
controller = AuthController()

@router.post("/register", response_model=RegisterResponse)
async def register(request: RegisterRequest):
    registerUser = await controller.register(request)
    return registerUser

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    loginUser = await controller.login(request)
    return loginUser