from app.tasks.service import TasksService
from app.tasks.schema import SectionCreate, TaskCreate, TaskUpdate

class TasksController:
    def __init__(self):
        self.service = TasksService()

    async def get_sections(self, user_data: dict):
        uid = user_data['uid']
        return await self.service.get_sections(uid)

    async def create_section(self, data: SectionCreate, user_data: dict):
        uid = user_data['uid']
        return await self.service.create_section(data, uid)

    async def create_task(self, data: TaskCreate, user_data: dict):
        uid = user_data['uid']
        return await self.service.create_task(data, uid)

    async def update_task(self, task_id: str, data: TaskUpdate, user_data: dict):
        uid = user_data['uid']
        return await self.service.update_task(task_id, data, uid)

    async def delete_task(self, task_id: str, user_data: dict):
        uid = user_data['uid']
        return await self.service.delete_task(task_id, uid)
