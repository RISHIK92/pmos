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
            notification_id = await schedule_notification(
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
            # Update task with notification Job ID
            await db.task.update(
                where={"id": task.id},
                data={"notificationJobId": notification_id}
            )
            
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
        
        updated_task = await db.task.update(
            where={"id": task_id},
            data=update_data
        )

        # Notification Logic
        if task.notificationJobId:
            from services.notify import reschedule_notification, update_notification_content, delete_notification
            
            # 1. Update Schedule if time changed
            if data.dueDate or data.dueTime:
                # Use new values if present, else fallback to existing
                new_date = data.dueDate or task.dueDate
                new_time = data.dueTime or task.dueTime
                
                if new_date and new_time:
                     await reschedule_notification(
                        task.notificationJobId, 
                        get_reminder_timestamp(new_date, new_time)
                    )

            # 2. Update Content if title changed
            if data.title:
                user = await db.user.find_unique(where={"id": uid})
                if user and user.fcmToken:
                    await update_notification_content(
                        task.notificationJobId,
                        {
                            "tokens": [user.fcmToken],
                            "title": "Task Due in 1hr",
                            "body": updated_task.title,
                            "data": {
                                "taskId": task.id,
                                "screen": "TaskDetail"
                            }
                        }
                    )
        
        # Determine if we should create a NEW notification (if one didn't exist before)
        elif (data.dueDate or data.dueTime) and not task.notificationJobId:
             # Check if we now have both date and time
             final_date = data.dueDate or task.dueDate
             final_time = data.dueTime or task.dueTime
             
             if final_date and final_time:
                user = await db.user.find_unique(where={"id": uid})
                if user and user.fcmToken:
                    notification_id = await schedule_notification(
                        payload={
                            "tokens": [user.fcmToken],
                            "title": "Task Due in 1hr",
                            "body": updated_task.title,
                            "data": {
                                "taskId": task.id,
                                "screen": "TaskDetail"
                            }
                        },
                        send_at=get_reminder_timestamp(final_date, final_time)
                    )
                    await db.task.update(
                        where={"id": task.id},
                        data={"notificationJobId": notification_id}
                    )

        return updated_task

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
        
        # Delete Notification if exists
        if task.notificationJobId:
            from services.notify import delete_notification
            await delete_notification(task.notificationJobId)
            
        return await db.task.delete(where={"id": task_id})
