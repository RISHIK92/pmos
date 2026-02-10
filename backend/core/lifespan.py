import os
from contextlib import asynccontextmanager
from prisma import Prisma
from redis.asyncio import Redis
from .firebase import initialize_firebase
import chromadb

db = Prisma()

redis = Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=0,
    decode_responses=True
)

chroma_client = chromadb.HttpClient(
    host=os.getenv("CHROMA_HOST", "localhost"), 
    port=int(os.getenv("CHROMA_PORT", 8001))
)

@asynccontextmanager
async def lifespan(app):
    """
    Lifespan context manager for FastAPI
    Connects to DB, Redis, Chromadb and initializes Firebase on startup
    """
    await db.connect()
    print("✅ Database connected")

    await redis.ping()
    print("✅ Redis connected")
    
    try:
        chroma_client.heartbeat()
        print(f"✅ ChromaDB connected")
    except Exception as e:
        print(f"❌ ChromaDB failed. Error: {e}")
        
    initialize_firebase()
    print("✅ Firebase initialized")

    
    yield
    
    await db.disconnect()
    print("❌ Database disconnected")

    await redis.close()
    print("❌ Redis disconnected")

__all__ = ["db", "lifespan", "redis"]