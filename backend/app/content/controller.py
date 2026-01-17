from app.content.service import ContentService
from app.content.schema import ContentItemCreate

class ContentController:
    def __init__(self):
        self.service = ContentService()

    async def get_all(self, user_data: dict):
        uid = user_data['uid']
        return await self.service.get_all(uid)

    async def create(self, data: ContentItemCreate, user_data: dict):
        uid = user_data['uid']
        return await self.service.create(data, uid)

    async def delete(self, item_id: str, user_data: dict):
        uid = user_data['uid']
        return await self.service.delete(item_id, uid)
