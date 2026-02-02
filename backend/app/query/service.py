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
from app.chains.summarizer import summarize_and_store
from app.chains.enricher import enrich_query
from app.chains.enricher import enrich_query
import asyncio
import json
from typing import AsyncGenerator
import logging
from langchain_core.messages import BaseMessage

class QueryService:
    def __init__(self):
        self.download_dir = Path(__file__).resolve().parent.parent.parent / "downloads"
        self.download_dir.mkdir(parents=True, exist_ok=True)


    async def query(self, query: QueryRequest, user: dict):
        uid = user["uid"]
        
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

        search_query = await enrich_query(query.query, messages_list)

        messages_list.append(HumanMessage(content=search_query))

        response = await master_agent.ainvoke(
            {
                "messages": messages_list,
                "user_profile": profile_str,
            },
            config={"configurable": {"user_id": uid}}
        )
        
        ai_response = response['messages'][-1]
        print(ai_response)
        print(ai_response.tool_calls)
        
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
        asyncio.create_task(
            summarize_and_store(query.query, ai_text, uid)
        )
        return result

    async def query_stream(self, query: QueryRequest, user: dict) -> AsyncGenerator[str, None]:
        uid = user["uid"]
        
        # 1. Setup Context
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
        
        # 2. Enrich Query (Emit thinking first)
        yield f"data: {json.dumps({'type': 'status', 'content': 'Thinking...'})}\n\n"
        search_query = await enrich_query(query.query, messages_list)
        messages_list.append(HumanMessage(content=search_query))

        # 3. Stream Execution
        final_response_text = ""
        is_client_action = False
        
        async for event in master_agent.astream_events(
            {
                "messages": messages_list,
                "user_profile": profile_str,
            },
            config={"configurable": {"user_id": uid}},
            version="v2"
        ):
            kind = event["event"]
            name = event["name"]
            
            # --- Check Intent / Final output ---
            if kind == "on_chat_model_end":
                output = event["data"].get("output")
                if output:
                    # Check for Client Tools
                    if hasattr(output, "tool_calls") and output.tool_calls:
                         for t_call in output.tool_calls:
                             if t_call["name"] in CLIENT_TOOL_NAMES:
                                 action_name = t_call["name"].replace("client_", "")
                                 yield f"data: {json.dumps({'type': 'CLIENT_ACTION', 'action': action_name, 'data': t_call['args']})}\n\n"
                                 is_client_action = True
                    
                    # Capture content (could be from search_llm or master_llm final response)
                    if output.content:
                        final_response_text = output.content

            # --- Tool Usage (Visuals) ---
            if kind == "on_tool_start":
                if name and name not in ["_Exception", "__arg1"]: 
                     yield f"data: {json.dumps({'type': 'tool_start', 'tool': name, 'input': event['data'].get('input')})}\n\n"

            elif kind == "on_tool_end":
                 if name:
                    output_data = event["data"].get("output")
                    # Truncate if too long (optional, but good for SSE)
                    output_str = str(output_data)
                    if len(output_str) > 200: output_str = output_str[:200] + "..."
                    yield f"data: {json.dumps({'type': 'tool_end', 'tool': name, 'output': output_str})}\n\n"

            # --- Status Updates ---
            if kind == "on_chain_start" and name == "search":
                 yield f"data: {json.dumps({'type': 'status', 'content': 'Searching the web...'})}\n\n"

        # 4. Finalize
        if not is_client_action:
            if final_response_text:
                # Yield final text
                yield f"data: {json.dumps({'type': 'response', 'response': final_response_text})}\n\n"
                
                # Save to DB
                await db.conversationlog.create(
                    data={
                        "userRaw": query.query,
                        "aiResponse": final_response_text,
                        "userId": uid
                    }
                )
                asyncio.create_task(
                    summarize_and_store(query.query, final_response_text, uid)
                )
            else:
                # Fallback if empty (shouldn't happen usually)
                yield f"data: {json.dumps({'type': 'response', 'response': 'I processed that, but have nothing to say.'})}\n\n"


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