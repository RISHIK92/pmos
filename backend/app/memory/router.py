from fastapi import APIRouter, Depends, HTTPException
from common.security import verify_token
from app.memory.controller import MemoryController
from app.memory.schema import MemoryCreate, MemoryResponse
from typing import List

router = APIRouter(prefix="/memory")
controller = MemoryController()

@router.get("/", response_model=List[MemoryResponse])
async def get_memories(user_data: dict = Depends(verify_token)):
    return await controller.get_all(user_data)

@router.post("/", response_model=MemoryResponse)
async def create_memory(memory: MemoryCreate, user_data: dict = Depends(verify_token)):
    return await controller.create(memory, user_data)

@router.delete("/{memory_id}")
async def delete_memory(memory_id: str, user_data: dict = Depends(verify_token)):
    result = await controller.delete(memory_id, user_data)
    if not result:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"message": "Memory deleted successfully"}
