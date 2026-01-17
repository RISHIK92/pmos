from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class BankAccountBase(BaseModel):
    name: str
    accountNumber: str
    balance: float = 0.0
    color: str = "#000000"

class BankAccountCreate(BankAccountBase):
    pass

class BankAccountUpdate(BaseModel):
    name: Optional[str] = None
    accountNumber: Optional[str] = None
    balance: Optional[float] = None
    color: Optional[str] = None

class BankAccount(BankAccountBase):
    id: str
    userId: str
    createdAt: datetime

    class Config:
        from_attributes = True

class TransactionCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    amount: float
    type: str  # "income", "expense"
    icon: str = "banknote"
    iconBg: str = "#000000"
    date: Optional[str] = None
    accountId: Optional[str] = None # Added accountId
