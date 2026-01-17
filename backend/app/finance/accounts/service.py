from services.db import db
from .schema import BankAccountCreate

class AccountsService:
    async def create(self, data: BankAccountCreate, uid: str):
        return await db.bankaccount.create(
            data={
                "userId": uid,
                "name": data.name,
                "accountNumber": data.accountNumber,
                "balance": data.balance,
                "color": data.color,
            }
        )

    async def get_all(self, uid: str):
        return await db.bankaccount.find_many(
            where={"userId": uid},
            include={"transactions": True},
            order={"createdAt": "asc"}
        )

    async def delete(self, account_id: str, uid: str):
        return await db.bankaccount.delete_many(
            where={"id": account_id, "userId": uid}
        )

    async def update(self, account_id: str, data: dict, uid: str):
        account = await db.bankaccount.find_first(
            where={"id": account_id, "userId": uid}
        )
        if not account:
            return None
        return await db.bankaccount.update(where={"id": account_id}, data=data)
