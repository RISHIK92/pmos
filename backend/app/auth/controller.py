from app.auth.schema import RegisterResponse
from app.auth.service import AuthService

service = AuthService()

class AuthController:
    async def register(self, userData: dict):
        registerUser = await service.register(uid= userData['uid'], email= userData['email'])
        return registerUser