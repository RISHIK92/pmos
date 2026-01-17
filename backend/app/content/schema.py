from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ContentItemCreate(BaseModel):
    type: str # "WATCH", "READ", "SOCIAL"
    title: str
    subtitle: Optional[str] = None
    platform: Optional[str] = None
    url: Optional[str] = None
    progress: Optional[float] = 0.0
    isRead: Optional[bool] = False
    image: Optional[str] = None
    notifications: Optional[int] = 0

class ContentItemResponse(BaseModel):
    id: str
    type: str
    title: str
    subtitle: Optional[str]
    platform: Optional[str]
    url: Optional[str]
    progress: float
    isRead: bool
    image: Optional[str]
    notifications: int
    createdAt: datetime
