from app.query.service import QueryService
from fastapi import UploadFile
from app.query.schema import QueryRequest

service = QueryService()

class QueryContoller:
    async def query(self, query: QueryRequest, user: dict):
        response = await service.query(query, user)
        return response
    
    async def query_stream(self, query: QueryRequest, user: dict):
        return service.query_stream(query, user)
    
    async def voice_query(self, file: UploadFile):
        temp_path = await service.save_query(file)

        response = await service.voice_query(temp_path)
        return response

    async def get_history(self, user: dict, limit: int = 7, cursor: str = None):
        uid = user["uid"]
        return await service.get_history(uid, limit, cursor)