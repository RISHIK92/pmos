from tomlkit import date
from pyexpat.errors import messages
from fastapi import UploadFile
from core.lifespan import db
import os
from pathlib import Path
from services.transcribe import voice_to_text
from app.query.schema import QueryRequest
from app.agents.master_agent import app as master_agent
from app.agents.tools import CLIENT_TOOL_NAMES
from langchain_core.messages import HumanMessage, AIMessage

class QueryService:
    def __init__(self):
        self.download_dir = Path(__file__).resolve().parent.parent.parent / "downloads"
        self.download_dir.mkdir(parents=True, exist_ok=True)


    async def query(self, query: QueryRequest, user: dict):
        uid = user["uid"]
        print(query.timestamp)
        
        found_docs = ["User put keys on the kitchen counter yesterday."]

        profile_str = "Name: Rishik, Role: Developer, Location: India"
        if query.timestamp:
            profile_str += f"\nUser Local Time: {query.timestamp}"

        recent_logs = await db.conversationlog.find_many(
            where={"userId": uid},
            order={"createdAt": "desc"},
            take=4
        )
        
        messages_list = []
        for log in reversed(recent_logs):
            messages_list.append(HumanMessage(content=log.userRaw))
            messages_list.append(AIMessage(content=log.aiResponse))
        
        # Add the current query
        messages_list.append(HumanMessage(content=query.query))

        response = await master_agent.ainvoke(
            {
                "messages": messages_list,
                "user_profile": profile_str,
                "vector_context": found_docs
            },
            config={"configurable": {"user_id": uid}}
        )
        
        ai_response = response['messages'][-1]
        print(ai_response)
        
        if hasattr(ai_response, 'tool_calls') and ai_response.tool_calls:
            tool_call = ai_response.tool_calls[0]
            tool_name = tool_call["name"]
            
            if tool_name in CLIENT_TOOL_NAMES:
                action_name = tool_name.replace("client_", "")
                
                result = {
                    "type": "CLIENT_ACTION",
                    "action": action_name,
                    "data": tool_call["args"]
                }
                
                return result
        
        # Normal text response
        ai_text = ai_response.content
        
        result = {
            "type": "TEXT",
            "response": ai_text
        }
        
        await db.conversationlog.create(
            data={
                "userRaw": query.query,
                "aiResponse": ai_text,
                "userId": uid
            }
        )
        return result

    async def save_query(self, file: UploadFile):
        temp_path = self.download_dir / f"temp_{file.filename}"
        
        content = await file.read() 
        with open(temp_path, "wb") as buffer:
            buffer.write(content)
        
        return str(temp_path)
    
    async def voice_query(self, temp_path: str):
        transcribed_text = voice_to_text(temp_path)

        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return transcribed_text

    async def get_history(self, user_id: str, limit: int = 7, cursor: str = None):
        params = {
            "where": {"userId": user_id},
            "take": limit,
            "order": {"createdAt": "desc"}
        }
        
        if cursor:
            params["cursor"] = {"id": cursor}
            params["skip"] = 1 # Skip the cursor itself
            
        logs = await db.conversationlog.find_many(**params)
        
        # Format dates if needed or return as is (Pydantic handles datetime -> str usually, but let's be safe)
        return logs