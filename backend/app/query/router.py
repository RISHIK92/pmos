from fastapi import APIRouter, UploadFile, File
from fastapi.param_functions import Depends
from common.security import verify_token
from app.query.controller import QueryContoller
from app.query.schema import QueryRequest, QueryResponse

router = APIRouter(prefix="/query")

controller = QueryContoller()

@router.post("/query")
async def query(query: QueryRequest):
    response = await controller.query(query)
    return response

@router.post("/voice")
async def voice_query(file: UploadFile = File(...)):
    response = await controller.voice_query(file)
    return response