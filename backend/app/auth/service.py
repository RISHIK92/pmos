class AuthService:
    def register(request: RegisterRequest):
        return RegisterResponse(message="User registered successfully")