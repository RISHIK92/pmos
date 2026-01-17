from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class FocusSessionCreate(BaseModel):
    mode: str
    duration: int
    timeSpent: int
    completed: bool
    reason: Optional[str] = None

class FocusSessionResponse(BaseModel):
    id: str
    startTime: datetime
    mode: str
    duration: int
    timeSpent: int
    completed: bool
    reason: Optional[str] = None
