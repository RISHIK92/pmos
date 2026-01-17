from services.db import db
from app.finance.schema import TransactionCreate, PendingTransactionCreate

class FinanceService:
    async def get_all(self, uid: str):
        return await db.transaction.find_many(
            where={"userId": uid},
            order={"createdAt": "desc"},
            include={"account": True}
        )

    async def create(self, data: TransactionCreate, uid: str):
        transaction = await db.transaction.create(
            data={
                "userId": uid,
                "payee": data.payee,
                "category": data.category,
                "amount": data.amount,
                "type": data.type,
                "icon": data.icon or "banknote",
                "iconBg": data.iconBg or "#000000",
                "accountId": data.accountId,
                "excludeFromBalance": data.excludeFromBalance or False
            },
            include={"account": True}
        )
        
        # Update Account Balance
        if data.accountId and not data.excludeFromBalance:
            account = await db.bankaccount.find_unique(where={"id": data.accountId})
            if account:
                new_bal = account.balance
                if data.type == "income":
                    new_bal += data.amount
                else:
                    new_bal -= data.amount
                await db.bankaccount.update(where={"id": data.accountId}, data={"balance": new_bal})
                
        return transaction

    async def delete(self, transaction_id: str, uid: str):
        # Verify ownership
        transaction = await db.transaction.find_first(
            where={"id": transaction_id, "userId": uid}
        )
        if not transaction:
            return None
            
        # Revert Account Balance
        if transaction.accountId and not transaction.excludeFromBalance:
            account = await db.bankaccount.find_unique(where={"id": transaction.accountId})
            if account:
                new_bal = account.balance
                # Revert: If Income -> Subtract. If Expense -> Add.
                if transaction.type == "income":
                    new_bal -= transaction.amount
                else:
                    new_bal += transaction.amount
                await db.bankaccount.update(where={"id": transaction.accountId}, data={"balance": new_bal})

        return await db.transaction.delete(where={"id": transaction_id})

    async def update(self, transaction_id: str, data: dict, uid: str):
        # Verify ownership
        old_transaction = await db.transaction.find_first(
            where={"id": transaction_id, "userId": uid}
        )
        if not old_transaction:
            return None

        # Revert Old Balance Effect
        if old_transaction.accountId and not old_transaction.excludeFromBalance:
            account = await db.bankaccount.find_unique(where={"id": old_transaction.accountId})
            if account:
                # Revert old
                bal = account.balance
                if old_transaction.type == "income":
                    bal -= old_transaction.amount
                else:
                    bal += old_transaction.amount
                
                # Apply New Logic
                # If fields are missing in data, they default to None. 
                # Wait, data is a DICT of changed fields. we need efficient merging.
                # Actually, simpler: Revert old first. Update DB. Apply new from DB result.
                
                await db.bankaccount.update(where={"id": old_transaction.accountId}, data={"balance": bal})

        # Do Update
        new_transaction = await db.transaction.update(
            where={"id": transaction_id},
            data=data,
            include={"account": True}
        )
        
        # Apply New Balance Effect
        if new_transaction.accountId and not new_transaction.excludeFromBalance:
            account = await db.bankaccount.find_unique(where={"id": new_transaction.accountId})
            if account:
                new_bal = account.balance
                if new_transaction.type == "income":
                    new_bal += new_transaction.amount
                else:
                    new_bal -= new_transaction.amount
                await db.bankaccount.update(where={"id": new_transaction.accountId}, data={"balance": new_bal})
                
        return new_transaction

    async def get_pending(self, uid: str):
        return await db.pendingtransaction.find_many(
            where={"userId": uid},
            order={"createdAt": "desc"}
        )

    async def create_pending(self, data: PendingTransactionCreate, uid: str):
        return await db.pendingtransaction.create(
            data={
                "userId": uid,
                "amount": data.amount,
                "payee": data.payee,
                "category": data.category,
                "type": data.type,
                "actionLabel": data.actionLabel
            }
        )

    async def delete_pending(self, pending_id: str, uid: str):
        item = await db.pendingtransaction.find_first(
            where={"id": pending_id, "userId": uid}
        )
        if not item:
            return None
            
        return await db.pendingtransaction.delete(where={"id": pending_id})
