from fastapi import UploadFile, File
from pydantic import BaseModel

class QueryRequest(BaseModel):
    file: UploadFile = File(...)

class QueryResponse(BaseModel):
    response: str
    status: int