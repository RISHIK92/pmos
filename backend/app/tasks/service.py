from services.notify import schedule_notification
from core.lifespan import db
from app.tasks.schema import SectionCreate, TaskCreate, TaskUpdate
from utils.timestamp_formatter import get_reminder_timestamp

class TasksService:
    async def get_sections(self, uid: str):
        # Fetch sections with tasks included, ordered by creation
        return await db.tasksection.find_many(
            where={"userId": uid},
            include={
                "tasks": {
                    "order_by": {"createdAt": "desc"}
                }
            },
            order={"createdAt": "asc"}
        )

    async def create_section(self, data: SectionCreate, uid: str):
        return await db.tasksection.create(
            data={
                "userId": uid,
                "title": data.title,
                "icon": data.icon,
                "color": data.color
            },
            include={"tasks": True}
        )

    async def create_task(self, data: TaskCreate, uid: str):
        # Verify section ownership
        section = await db.tasksection.find_first(
            where={"id": data.sectionId, "userId": uid}
        )
        if not section:
            return None

        task = await db.task.create(
            data={
                "sectionId": data.sectionId,
                "title": data.title,
                "status": data.status,
                "due": data.due,
                "dueDate": data.dueDate,
                "dueTime": data.dueTime
            }
        )

        # Send Notification
        user = await db.user.find_unique(where={"id": uid})
        if user and user.fcmToken:
            notification = await schedule_notification(
                payload={
                    "tokens": [user.fcmToken],
                    "title": "Task Due in 1hr",
                    "body": task.title,
                    "data": {
                        "taskId": task.id,
                        "screen": "TaskDetail"
                    }
                },
                send_at=get_reminder_timestamp(task.dueDate, task.dueTime)
            )
            print(notification)
        return task

    async def update_task(self, task_id: str, data: TaskUpdate, uid: str):
        # Verify ownership via section
        task = await db.task.find_first(
            where={
                "id": task_id,
                "section": {"userId": uid}
            }
        )
        if not task:
            return None

        update_data = {}
        if data.title is not None: update_data["title"] = data.title
        if data.status is not None: update_data["status"] = data.status
        if data.due is not None: update_data["due"] = data.due
        if data.dueDate is not None: update_data["dueDate"] = data.dueDate
        if data.dueTime is not None: update_data["dueTime"] = data.dueTime
        
        return await db.task.update(
            where={"id": task_id},
            data=update_data
        )

    async def delete_task(self, task_id: str, uid: str):
        # Verify ownership via section
        task = await db.task.find_first(
            where={
                "id": task_id,
                "section": {"userId": uid}
            }
        )
        if not task:
            return None
            
        return await db.task.delete(where={"id": task_id})
