from fastapi import APIRouter, Depends, HTTPException
from common.security import verify_token
from app.content.controller import ContentController
from app.content.schema import ContentItemCreate, ContentItemResponse
from typing import List

router = APIRouter(prefix="/content")
controller = ContentController()

@router.get("", response_model=List[ContentItemResponse])
async def get_all(user_data: dict = Depends(verify_token)):
    return await controller.get_all(user_data)

@router.post("", response_model=ContentItemResponse)
async def create(data: ContentItemCreate, user_data: dict = Depends(verify_token)):
    return await controller.create(data, user_data)

@router.delete("/{item_id}")
async def delete(item_id: str, user_data: dict = Depends(verify_token)):
    result = await controller.delete(item_id, user_data)
    if not result:
        raise HTTPException(status_code=404, detail="Content Item not found or Unauthorized")
    return {"message": "Content Item deleted successfully"}
