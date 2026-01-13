from contextlib import asynccontextmanager
from prisma import Prisma
from .firebase import initialize_firebase

db = Prisma()

@asynccontextmanager
async def lifespan(app):
    """
    Lifespan context manager for FastAPI
    Connects to DB and initializes Firebase on startup
    """
    await db.connect()
    print("✅ Database connected")
    
    initialize_firebase()
    
    yield
    
    await db.disconnect()
    print("❌ Database disconnected")

__all__ = ["db", "lifespan"]