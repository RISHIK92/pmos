from app.query.service import QueryService
from fastapi import UploadFile
from app.query.schema import QueryRequest

service = QueryService()

class QueryContoller:
    async def query(self, query: QueryRequest):
        response = await service.query(query)
        return response
    
    async def voice_query(self, file: UploadFile):
        temp_path = await service.save_query(file)

        response = await service.voice_query(temp_path)
        return response