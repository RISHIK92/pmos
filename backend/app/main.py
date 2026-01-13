import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from services.db import lifespan
from fastapi import FastAPI
from app.auth.router import router

app = FastAPI(lifespan=lifespan)

app.include_router(router)

@app.get("/")
def root():
    return {"message": "System Online"}