from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class JournalRequest(BaseModel):
    date: str # YYYY-MM-DD
    content: str
    type: str = "PERSONAL" # PERSONAL, DEV

class JournalResponse(BaseModel):
    id: str
    userId: str
    date: str
    content: str
    type: str
    createdAt: datetime
    updatedAt: datetime
