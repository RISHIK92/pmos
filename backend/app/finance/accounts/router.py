from fastapi import APIRouter, Depends, HTTPException
from typing import List
from common.security import verify_token
from .controller import AccountsController
from . import schema

router = APIRouter(prefix="/finance/accounts")
controller = AccountsController()

@router.post("/", response_model=schema.BankAccount)
async def create_account(
    account: schema.BankAccountCreate,
    user_data: dict = Depends(verify_token)
):
    return await controller.create_account(account, user_data)

@router.get("/", response_model=List[schema.BankAccount])
async def get_accounts(
    user_data: dict = Depends(verify_token)
):
    return await controller.get_accounts(user_data)

@router.delete("/{account_id}")
async def delete_account(
    account_id: str,
    user_data: dict = Depends(verify_token)
):
    await controller.delete_account(account_id, user_data)
    return {"message": "Account deleted"}

@router.patch("/{account_id}", response_model=schema.BankAccount)
async def update_account(
    account_id: str,
    data: schema.BankAccountUpdate,
    user_data: dict = Depends(verify_token)
):
    result = await controller.update_account(account_id, data, user_data)
    if not result:
        raise HTTPException(status_code=404, detail="Account not found")
    return result
