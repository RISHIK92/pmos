import jwt
from app.auth.schema import RegisterRequest, RegisterResponse
from services.db import db

class AuthService:
    async def register(self, uid: str, email: str):
        existingUser = await db.user.find_unique(
            where={
                "id": uid,
            }
        )

        if existingUser:
            return RegisterResponse(message="Login Successful", status=200)

        if not existingUser:
            await db.user.create(
                data={
                    "id": uid,
                    "email": email,
                }
        )
        return RegisterResponse(message="Login Successful", status=200)