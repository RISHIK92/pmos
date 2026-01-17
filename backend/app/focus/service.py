from services.db import db
from app.focus.schema import FocusSessionCreate

class FocusService:
    async def get_history(self, uid: str):
        return await db.focussession.find_many(
            where={"userId": uid},
            order={"startTime": "desc"},
            take=50 
        )

    async def create_session(self, data: FocusSessionCreate, uid: str):
        return await db.focussession.create(
            data={
                "userId": uid,
                "mode": data.mode,
                "duration": data.duration,
                "timeSpent": data.timeSpent,
                "completed": data.completed,
                "reason": data.reason
            }
        )
