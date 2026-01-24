from fastapi import UploadFile
from core.lifespan import db
import os
from pathlib import Path
from services.transcribe import voice_to_text
from app.query.schema import QueryRequest

class QueryService:
    def __init__(self):
        self.download_dir = Path(__file__).resolve().parent.parent.parent / "downloads"
        self.download_dir.mkdir(parents=True, exist_ok=True)


    async def query(self, query: QueryRequest):
        # response = await db.query.create(
        #     data={
        #         "query": query,
        #         "userId": uid
        #     }
        # )
        response = {
            "response": query.query
        }
        return response

    async def save_query(self, file: UploadFile):
        temp_path = self.download_dir / f"temp_{file.filename}"
        
        content = await file.read() 
        with open(temp_path, "wb") as buffer:
            buffer.write(content)
        
        return str(temp_path)
    
    async def voice_query(self, temp_path: str):
        transcribed_text = voice_to_text(temp_path)

        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return transcribed_text