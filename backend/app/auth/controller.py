from app.auth.schema import RegisterRequest, RegisterResponse
from app.auth.service import AuthService

service = AuthService()

class AuthController:
    def register(request: RegisterRequest):
        registerUser = service.register(request)
        return registerUser