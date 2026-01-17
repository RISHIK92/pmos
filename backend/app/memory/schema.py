from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class MemoryCreate(BaseModel):
    title: str
    content: str
    tags: List[str]

class MemoryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None

class MemoryResponse(BaseModel):
    id: str
    title: str
    content: str
    tags: List[str]
    createdAt: datetime
