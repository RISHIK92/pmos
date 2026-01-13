from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    email: EmailStr

class RegisterResponse(BaseModel):
    message: str

class LoginRequest(BaseModel):
    email: EmailStr

class LoginResponse(BaseModel):
    # access_token: str
    # token_type: str
    message: str