from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class ConversationMessage(BaseModel):
    text: str
    sender: str  # "user" or "system"

class QueryRequest(BaseModel):
    query: str
    conversation_history: Optional[List[ConversationMessage]] = None
    timestamp: Optional[str] = None

class QueryResponse(BaseModel):
    response: str

class ConversationLogResponse(BaseModel):
    id: str
    user_raw: str = Field(validation_alias="userRaw")
    ai_response: str = Field(validation_alias="aiResponse")
    created_at: datetime = Field(validation_alias="createdAt")
    
    class Config:
        from_attributes = True
