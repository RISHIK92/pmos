import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from services.db import lifespan
from fastapi import FastAPI
from app.auth.router import router as auth_router
from app.query.router import router as query_router

app = FastAPI(lifespan=lifespan)

app.include_router(auth_router)
app.include_router(query_router)

@app.get("/")
def root():
    return {"message": "System Online"}