from app.finance.service import FinanceService
from app.finance.schema import TransactionCreate, PendingTransactionCreate

class FinanceController:
    def __init__(self):
        self.service = FinanceService()

    async def get_all(self, user_data: dict):
        uid = user_data['uid']
        return await self.service.get_all(uid)

    async def create(self, data: TransactionCreate, user_data: dict):
        uid = user_data['uid']
        return await self.service.create(data, uid)

    async def delete(self, transaction_id: str, user_data: dict):
        uid = user_data['uid']
        return await self.service.delete(transaction_id, uid)

    async def update(self, transaction_id: str, data: any, user_data: dict):
        uid = user_data['uid']
        # Convert Pydantic model to dict, excluding None
        update_data = {k: v for k, v in data.dict().items() if v is not None}
        return await self.service.update(transaction_id, update_data, uid)

    async def get_pending(self, user_data: dict):
        uid = user_data['uid']
        return await self.service.get_pending(uid)

    async def create_pending(self, data: PendingTransactionCreate, user_data: dict):
        uid = user_data['uid']
        return await self.service.create_pending(data, uid)

    async def delete_pending(self, pending_id: str, user_data: dict):
        uid = user_data['uid']
        return await self.service.delete_pending(pending_id, uid)
