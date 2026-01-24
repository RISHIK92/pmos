import os
from contextlib import asynccontextmanager
from prisma import Prisma
from redis.asyncio import Redis
from .firebase import initialize_firebase

db = Prisma()
redis = Redis(host=os.getenv("REDIS_HOST", "localhost"), port=int(os.getenv("REDIS_PORT", 6379)), db=0, password=os.getenv("REDIS_PASSWORD"), decode_responses=True)

@asynccontextmanager
async def lifespan(app):
    """
    Lifespan context manager for FastAPI
    Connects to DB and initializes Firebase on startup
    """
    await db.connect()
    print("✅ Database connected")

    await redis.ping()
    print("✅ Redis connected")
    
    initialize_firebase()
    
    yield
    
    await db.disconnect()
    print("❌ Database disconnected")

    await redis.close()
    print("❌ Redis disconnected")

__all__ = ["db", "lifespan", "redis"]