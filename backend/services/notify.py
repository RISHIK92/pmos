import json
import uuid
from core.lifespan import redis

QUEUE_KEY = "notification_queue"        # The ZSET
PAYLOAD_PREFIX = "notification:data:"   # The Hash

async def schedule_notification(payload: dict, send_at: float) -> str:
    job_id = str(uuid.uuid4())
    payload_key = f"{PAYLOAD_PREFIX}{job_id}"

    await redis.set(payload_key, json.dumps(payload))
    await redis.zadd(QUEUE_KEY, {job_id: send_at})

    print(f"Scheduled notification {job_id} for {send_at}")

    return job_id

async def update_notification_content(job_id: str, new_payload: dict) -> None:
    payload_key = f"{PAYLOAD_PREFIX}{job_id}"

    await redis.set(payload_key, json.dumps(new_payload))
    print(f"Updated notification {job_id}")

async def reschedule_notification(job_id: str, new_send_at: float) -> None:
    await redis.zadd(QUEUE_KEY, {job_id: new_send_at})
    print(f"Rescheduled notification {job_id} for {new_send_at}")

async def delete_notification(job_id: str) -> None:
    await redis.zrem(QUEUE_KEY, job_id)
    await redis.delete(f"{PAYLOAD_PREFIX}{job_id}")
    print(f"Deleted notification {job_id}")