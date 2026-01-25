from core.lifespan import db
from app.journal.schema import JournalRequest, JournalResponse
from typing import Optional

class JournalService:
    async def get_journal_today(self, uid: str, date: str, type: str = "PERSONAL") -> Optional[JournalResponse]:
        doc = await db.dailyjournal.find_unique(
            where={
                "userId_date_type": {
                    "userId": uid,
                    "date": date,
                    "type": type
                }
            }
        )
        if not doc:
            return None
        return JournalResponse(**doc.dict())

    async def upsert_journal(self, uid: str, data: JournalRequest) -> JournalResponse:
        doc = await db.dailyjournal.upsert(
            where={
                "userId_date_type": {
                    "userId": uid,
                    "date": data.date,
                    "type": data.type
                }
            },
            data={
                "create": {
                    "userId": uid,
                    "date": data.date,
                    "content": data.content,
                    "type": data.type
                },
                "update": {
                    "content": data.content
                }
            }
        )
        return JournalResponse(**doc.dict())

    async def delete_journal(self, uid: str, id: str) -> bool:
        # Verify ownership
        journal = await db.dailyjournal.find_unique(where={"id": id})
        if not journal or journal.userId != uid:
             return False
        
        await db.dailyjournal.delete(where={"id": id})
        return True

    async def get_history(self, uid: str, type: str = "PERSONAL", limit: int = 10) -> list[JournalResponse]:
        docs = await db.dailyjournal.find_many(
            where={
                "userId": uid,
                "type": type
            },
            order={
                "date": "desc"
            },
            take=limit
        )
        return [JournalResponse(**d.dict()) for d in docs]
