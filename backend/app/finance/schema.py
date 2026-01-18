from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from pydantic.config import ConfigDict

from app.finance.accounts.schema import BankAccount

class TransactionCreate(BaseModel):
    payee: str
    category: Optional[str] = None
    amount: float
    type: str # "income" or "expense"
    icon: Optional[str] = "banknote"
    iconBg: Optional[str] = "#000000"
    accountId: Optional[str] = None
    excludeFromBalance: Optional[bool] = False

class TransactionUpdate(BaseModel):
    payee: Optional[str] = None
    category: Optional[str] = None

class TransactionResponse(BaseModel):
    id: str
    payee: str
    category: Optional[str]
    amount: float
    type: str
    icon: str
    iconBg: str
    createdAt: datetime
    excludeFromBalance: bool
    account: Optional[BankAccount] = None
    model_config = ConfigDict(from_attributes=True)

class PendingTransactionCreate(BaseModel):
    amount: str
    payee: str
    category: str
    type: str
    actionLabel: str

class PendingTransactionResponse(BaseModel):
    id: str
    amount: str
    payee: str
    category: str
    type: str
    actionLabel: str
    createdAt: datetime
