from auth.schema import RegisterRequest, RegisterResponse, LoginRequest, LoginResponse
from auth.service import AuthService

service = AuthService()

class AuthController:
    async def register(self, request: RegisterRequest):
        registerUser = await service.register(request)
        return registerUser

    async def login(self, request: LoginRequest):
        loginUser = await service.login(request)
        return loginUser