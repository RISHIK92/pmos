from app.focus.service import FocusService
from app.focus.schema import FocusSessionCreate

class FocusController:
    def __init__(self):
        self.service = FocusService()

    async def get_history(self, user_data: dict):
        uid = user_data["uid"]
        return await self.service.get_history(uid)

    async def create_session(self, data: FocusSessionCreate, user_data: dict):
        uid = user_data["uid"]
        return await self.service.create_session(data, uid)
