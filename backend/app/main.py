from db import lifespan
from fastapi import FastAPI
from auth.router import router

app = FastAPI(lifespan=lifespan)

app.include_router(router)

@app.get("/")
def root():
    return {"message": "System Online"}