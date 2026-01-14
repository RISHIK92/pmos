from fastapi import APIRouter, UploadFile, File
from fastapi.param_functions import Depends
from common.security import verify_token
from app.query.controller import QueryContoller
from app.query.schema import QueryRequest, QueryResponse

router = APIRouter(prefix="/query", tags=["Query", "Input"])

controller = QueryContoller()

@router.post("/text", response_model=QueryResponse)
async def query(query: QueryRequest, user_data: dict = Depends(verify_token)):
    response = await controller.query(query, user_data)
    return response

@router.post("/voice")
async def voice_query(file: UploadFile = File(...)):
    response = await controller.voice_query(file)
    return response