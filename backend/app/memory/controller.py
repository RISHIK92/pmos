from app.memory.service import MemoryService
from app.memory.schema import MemoryCreate

class MemoryController:
    def __init__(self):
        self.service = MemoryService()

    async def get_all(self, user_data: dict):
        uid = user_data['uid']
        return await self.service.get_all(uid)

    async def create(self, data: MemoryCreate, user_data: dict):
        uid = user_data['uid']
        return await self.service.create(data, uid)

    async def delete(self, memory_id: str, user_data: dict):
        uid = user_data['uid']
        return await self.service.delete(memory_id, uid)
