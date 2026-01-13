from fastapi import FastAPI
from prisma import Prisma
from contextlib import asynccontextmanager

db = Prisma()

@asynccontextmanager
async def lifespan(app=FastAPI):
    await db.connect()
    yield
    await db.disconnect()