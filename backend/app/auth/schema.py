from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    email: EmailStr
    uid: str

class RegisterResponse(BaseModel):
    message: str
    status: int