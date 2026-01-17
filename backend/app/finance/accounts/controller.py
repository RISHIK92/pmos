from .service import AccountsService
from .schema import BankAccountCreate

class AccountsController:
    def __init__(self):
        self.service = AccountsService()

    async def create_account(self, data: BankAccountCreate, user_data: dict):
        uid = user_data['uid']
        return await self.service.create(data, uid)

    async def get_accounts(self, user_data: dict):
        uid = user_data['uid']
        return await self.service.get_all(uid)

    async def delete_account(self, account_id: str, user_data: dict):
        uid = user_data['uid']
        return await self.service.delete(account_id, uid)

    async def update_account(self, account_id: str, data: any, user_data: dict):
        uid = user_data['uid']
        update_data = {k: v for k, v in data.dict().items() if v is not None}
        return await self.service.update(account_id, update_data, uid)
