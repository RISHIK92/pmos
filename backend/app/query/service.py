from fastapi import UploadFile
from services.db import db
import os
from pathlib import Path

class QueryService:
    def __init__(self):
        self.download_dir = Path(__file__).resolve().parent.parent.parent / "downloads"
        self.download_dir.mkdir(parents=True, exist_ok=True)


    # async def query(self, query: str, email: str):

    async def save_query(self, file: UploadFile):
        temp_path = self.download_dir / f"temp_{file.filename}"
        
        content = await file.read() 
        with open(temp_path, "wb") as buffer:
            buffer.write(content)
        
        return str(temp_path)
    
    async def voice_query(self, temp_path: str):
        transcribed_text = transcribe_and_translate(temp_path)

        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return transcribed_text