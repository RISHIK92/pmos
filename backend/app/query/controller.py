from app.query.service import QueryService
from fastapi import UploadFile

service = QueryService()

class QueryContoller:
    async def query(self, query: str, user_data: dict):
        response = await service.query(query, email=user_data['uid'])
        return response
    
    async def voice_query(self, file: UploadFile):
        temp_path = await service.save_query(file)

        response = await service.voice_query(temp_path)
        return response