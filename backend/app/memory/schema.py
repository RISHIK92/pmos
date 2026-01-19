from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class MemoryCreate(BaseModel):
    title: str
    content: str
    tags: List[str]
    isCritical: Optional[bool] = False
    reminderTime: Optional[str] = None
    repeatPattern: Optional[str] = None
    reminderDate: Optional[str] = None

class MemoryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    isCritical: Optional[bool] = None
    reminderTime: Optional[str] = None
    repeatPattern: Optional[str] = None
    reminderDate: Optional[str] = None

class MemoryResponse(BaseModel):
    id: str
    title: str
    content: str
    tags: List[str]
    createdAt: datetime
    isCritical: bool
    reminderTime: Optional[str] = None
    repeatPattern: Optional[str] = None
    reminderDate: Optional[str] = None
