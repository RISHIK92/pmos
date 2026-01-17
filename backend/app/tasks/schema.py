from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Task Schemas
class TaskCreate(BaseModel):
    sectionId: str
    title: str
    status: str = "Pending"
    due: Optional[str] = None
    dueDate: Optional[str] = None
    dueTime: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    due: Optional[str] = None
    dueDate: Optional[str] = None
    dueTime: Optional[str] = None

class TaskResponse(BaseModel):
    id: str
    sectionId: str
    title: str
    status: str
    due: Optional[str]
    dueDate: Optional[str]
    dueTime: Optional[str]
    createdAt: datetime
    updatedAt: datetime

# Section Schemas
class SectionCreate(BaseModel):
    title: str
    icon: str = "list.bullet"
    color: str = "#0984E3"

class SectionUpdate(BaseModel):
    title: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None

class SectionResponse(BaseModel):
    id: str
    title: str
    icon: str
    color: str
    tasks: List[TaskResponse]
    createdAt: datetime
