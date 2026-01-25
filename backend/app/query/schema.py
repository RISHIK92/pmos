from pydantic import BaseModel, Field
from datetime import datetime

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    response: str

class ConversationLogResponse(BaseModel):
    id: str
    user_raw: str = Field(validation_alias="userRaw")
    ai_response: str = Field(validation_alias="aiResponse")
    created_at: datetime = Field(validation_alias="createdAt")
    
    class Config:
        from_attributes = True
