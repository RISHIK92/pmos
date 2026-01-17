from services.db import db
from app.memory.schema import MemoryCreate, MemoryUpdate

class MemoryService:
    async def get_all(self, uid: str):
        memories = await db.memory.find_many(
            where={"userId": uid},
            order={"createdAt": "desc"}
        )
        return memories

    async def create(self, data: MemoryCreate, uid: str):
        memory = await db.memory.create(
            data={
                "userId": uid,
                "title": data.title,
                "content": data.content,
                "tags": data.tags
            }
        )
        return memory

    async def delete(self, memory_id: str, uid: str):
        # Verify ownership
        memory = await db.memory.find_first(
            where={"id": memory_id, "userId": uid}
        )
        if not memory:
            return None
            
        deleted = await db.memory.delete(where={"id": memory_id})
        return deleted
