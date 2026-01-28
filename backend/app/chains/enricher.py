from typing import List
from langchain_core.messages import SystemMessage, HumanMessage, BaseMessage
from langchain_groq import ChatGroq
import os

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.1,
    max_retries=2,
)

async def enrich_query(raw_query: str, history_messages: List[BaseMessage]) -> str:
    """
    Expands the query using conversation history to resolve pronouns and ambiguity.
    """
    # Convert history objects to a simple string for the prompt
    history_text = "\n".join([f"{m.type}: {m.content}" for m in history_messages[-3:]]) # Keep last 3 turns
    
    system_prompt = f"""
    You are a Search Query Optimizer for a RAG system.
    
    === CONVERSATION HISTORY ===
    {history_text}
    
    === CURRENT USER INPUT ===
    "{raw_query}"
    
    === YOUR TASK ===
    Rewrite the "Current User Input" into a standalone, specific search query.
    1. Resolve pronouns (it, he, she, that) using History.
    2. Add missing context.
    3. Do NOT answer the question. Just rewrite it for the search engine.
    4. If the query is already self-contained (e.g. "What is 2+2"), output it exactly as is.
    
    Example 1:
    History: User: Who is CEO of Google? AI: Sundar Pichai.
    Input: "How old is he?"
    Output: "How old is Sundar Pichai?"
    
    Example 2:
    History: User: Save a note about buying milk. AI: Saved.
    Input: "What did I just save?"
    Output: "What was the last note I saved?"
    """
    
    try:
        response = await llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content="Output search query only:")
        ])
        enriched = response.content.strip().replace('"', '')
        print(f"✨ [Enricher] '{raw_query}' -> '{enriched}'")
        return enriched
    except Exception as e:
        print(f"⚠️ [Enricher Failed] {e}")
        return raw_query