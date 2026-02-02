from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.param_functions import Depends
from common.security import verify_token
from app.query.controller import QueryContoller
from app.query.schema import QueryRequest, QueryResponse, ConversationLogResponse

router = APIRouter(prefix="/query")

controller = QueryContoller()

@router.post("/query")
async def query(query: QueryRequest, user: dict = Depends(verify_token)):
    stream = await controller.query_stream(query, user)
    return StreamingResponse(stream, media_type="text/event-stream")

@router.post("/voice")
async def voice_query(file: UploadFile = File(...)):
    response = await controller.voice_query(file)
    return response

@router.get("/history", response_model=list[ConversationLogResponse])
async def get_history(limit: int = 7, cursor: str = None, user: dict = Depends(verify_token)):
    return await controller.get_history(user, limit, cursor)