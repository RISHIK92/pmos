from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from common.security import verify_token
from app.finance.controller import FinanceController
from app.finance.schema import TransactionCreate, TransactionResponse, PendingTransactionCreate, PendingTransactionResponse, TransactionUpdate
from typing import List, Optional
from services.sms_parser import parse_sms as parse_sms_service
from core.lifespan import db

router = APIRouter(prefix="/finance")
controller = FinanceController()

class ParseSmsRequest(BaseModel):
    body: str
    sender: str

class ParseSmsResponse(BaseModel):
    success: bool
    transaction: Optional[TransactionResponse] = None
    message: str

@router.get("/transactions", response_model=List[TransactionResponse])
async def get_all(user_data: dict = Depends(verify_token)):
    return await controller.get_all(user_data)

@router.post("/transactions", response_model=TransactionResponse)
async def create(data: TransactionCreate, user_data: dict = Depends(verify_token)):
    return await controller.create(data, user_data)

@router.delete("/transactions/{transaction_id}")
async def delete(transaction_id: str, user_data: dict = Depends(verify_token)):
    result = await controller.delete(transaction_id, user_data)
    if not result:
        raise HTTPException(status_code=404, detail="Transaction not found or Unauthorized")
    return {"message": "Transaction deleted successfully"}

@router.patch("/transactions/{transaction_id}", response_model=TransactionResponse)
async def update(transaction_id: str, data: TransactionUpdate, user_data: dict = Depends(verify_token)):
    result = await controller.update(transaction_id, data, user_data)
    if not result:
        raise HTTPException(status_code=404, detail="Transaction not found or Unauthorized")
    return result

@router.get("/pending", response_model=List[PendingTransactionResponse])
async def get_pending(user_data: dict = Depends(verify_token)):
    return await controller.get_pending(user_data)

@router.post("/pending", response_model=PendingTransactionResponse)
async def create_pending(data: PendingTransactionCreate, user_data: dict = Depends(verify_token)):
    return await controller.create_pending(data, user_data)

@router.delete("/pending/{pending_id}")
async def delete_pending(pending_id: str, user_data: dict = Depends(verify_token)):
    result = await controller.delete_pending(pending_id, user_data)
    if not result:
        raise HTTPException(status_code=404, detail="Pending Transaction not found or Unauthorized")
    return {"message": "Pending Transaction deleted successfully"}

@router.post("/parse-sms", response_model=ParseSmsResponse)
async def parse_sms(request: ParseSmsRequest, user_data: dict = Depends(verify_token)):
    """
    Parse an SMS using Groq AI and create a transaction if valid.
    Pre-validates that the SMS contains a registered account number.
    """
    import re
    
    uid = user_data['uid']
    
    # 1. Fetch user's bank accounts
    accounts = await db.bankaccount.find_many(
        where={"userId": uid}
    )
    
    if not accounts:
        return ParseSmsResponse(success=False, transaction=None, message="No bank accounts registered")
    
    account_list = [{"id": acc.id, "accountNumber": acc.accountNumber} for acc in accounts]
    user_account_numbers = {acc.accountNumber for acc in accounts}
    
    sms_acc_pattern = r'(?:x{2,}|\*{2,}|ending|a/c|card|ac)\s*[-:\s]*(\d{3,4})'
    found_acc_numbers = re.findall(sms_acc_pattern, request.body, re.IGNORECASE)
    
    matched = False
    for found_acc in found_acc_numbers:
        if found_acc in user_account_numbers:
            matched = True
            break
    
    if not matched:
        return ParseSmsResponse(
            success=False, 
            transaction=None, 
            message=f"No matching account found. SMS accounts: {found_acc_numbers}, User accounts: {list(user_account_numbers)}"
        )
    
    parsed = await parse_sms_service(request.body, account_list)
    
    if not parsed:
        return ParseSmsResponse(success=False, transaction=None, message="Not a valid transaction SMS")
    
    transaction_data = TransactionCreate(
        payee=parsed.get("merchant", "Unknown"),
        category=parsed.get("category", "Other"),
        amount=parsed.get("amount", 0),
        type=parsed.get("type", "expense"),
        icon="envelope.fill",
        iconBg="#0984E3",
        accountId=parsed.get("account_id")
    )
    
    transaction = await controller.create(transaction_data, user_data)
    
    transaction_response = TransactionResponse.model_validate(transaction)
    
    return ParseSmsResponse(
        success=True,
        transaction=transaction_response,
        message=f"Transaction created: ₹{parsed.get('amount')} {parsed.get('type')}"
    )