from certifi.core import where
from auth.schema import RegisterRequest, RegisterResponse, LoginRequest, LoginResponse
from db import db

class AuthService:
    async def register(self, request: RegisterRequest):
        user = await db.user.create(
            data={
                "email": request.email,
            }
        )
        return RegisterResponse(message=user.id)

    async def login(self, request: LoginRequest):
        user = await db.user.find_unique(
            where={
                "email": request.email
            }
        )
        if user:
            return LoginResponse(message=user.id)
        else:
            return LoginResponse(message="User not found.")