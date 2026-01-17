from fastapi import APIRouter, Depends, HTTPException
from app.auth.router import verify_token
from app.tasks.controller import TasksController
from app.tasks.schema import SectionCreate, SectionResponse, TaskCreate, TaskResponse, TaskUpdate
from typing import List

router = APIRouter(prefix="/tasks")
controller = TasksController()

@router.get("/sections", response_model=List[SectionResponse])
async def get_sections(user_data: dict = Depends(verify_token)):
    return await controller.get_sections(user_data)

@router.post("/sections", response_model=SectionResponse)
async def create_section(section: SectionCreate, user_data: dict = Depends(verify_token)):
    return await controller.create_section(section, user_data)

@router.post("/tasks", response_model=TaskResponse)
async def create_task(task: TaskCreate, user_data: dict = Depends(verify_token)):
    result = await controller.create_task(task, user_data)
    if not result:
        raise HTTPException(status_code=400, detail="Invalid Section ID or Unauthorized")
    return result

@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, task: TaskUpdate, user_data: dict = Depends(verify_token)):
    result = await controller.update_task(task_id, task, user_data)
    if not result:
        raise HTTPException(status_code=404, detail="Task not found or Unauthorized")
    return result

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user_data: dict = Depends(verify_token)):
    result = await controller.delete_task(task_id, user_data)
    if not result:
        raise HTTPException(status_code=404, detail="Task not found or Unauthorized")
    return {"message": "Task deleted successfully"}
