import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from services.db import lifespan
from fastapi import FastAPI
from app.auth.router import router as auth_router
from app.query.router import router as query_router
from app.memory.router import router as memory_router
from app.tasks.router import router as tasks_router
from app.finance.router import router as finance_router
from app.finance.accounts.router import router as accounts_router
from app.content.router import router as content_router
from app.focus.router import router as focus_router
from app.nutrition.router import router as nutrition_router

app = FastAPI(lifespan=lifespan)

app.include_router(auth_router)
app.include_router(query_router)
app.include_router(memory_router)
app.include_router(tasks_router)
app.include_router(finance_router, tags=["finance"])
app.include_router(accounts_router, tags=["accounts"])
app.include_router(content_router)
app.include_router(focus_router)
app.include_router(nutrition_router)

@app.get("/")
def root():
    return {"message": "System Online"}