from core.lifespan import db
from app.content.schema import ContentItemCreate

class ContentService:
    async def get_all(self, uid: str):
        return await db.contentitem.find_many(
            where={"userId": uid},
            order={"createdAt": "desc"}
        )

    async def create(self, data: ContentItemCreate, uid: str):
        return await db.contentitem.create(
            data={
                "userId": uid,
                "type": data.type,
                "title": data.title,
                "subtitle": data.subtitle,
                "platform": data.platform,
                "url": data.url,
                "progress": data.progress,
                "isRead": data.isRead,
                "image": data.image,
                "notifications": data.notifications
            }
        )

    async def delete(self, item_id: str, uid: str):
        item = await db.contentitem.find_first(
            where={"id": item_id, "userId": uid}
        )
        if not item:
            return None
            
        return await db.contentitem.delete(where={"id": item_id})
