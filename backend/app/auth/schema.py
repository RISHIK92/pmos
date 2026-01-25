from pydantic import BaseModel, EmailStr
from typing import Optional

class RegisterRequest(BaseModel):
    email: EmailStr = None
    uid: str = None
    fcmToken: Optional[str] = None

class RegisterResponse(BaseModel):
    message: str
    status: int
    githubUsername: Optional[str] = None