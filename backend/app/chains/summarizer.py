from app.services.memory_store import memory_store
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_groq import ChatGroq
import os

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.1,
    max_retries=2,
)

async def summarize_and_store(user_query: str, ai_response: str, user_id: str):
    """
    Summarizes the interaction and saves ONLY meaningful facts to MemoryStore.
    """
    # 1. Ask LLM to extract facts
    summary_prompt = f"""
    Analyze this interaction between User and AI.
    User: "{user_query}"
    AI: "{ai_response}"
    
    Task: Extract any meaningful facts, preferences, plans, or completed actions.
    - If it's just chit-chat (e.g., "Hi", "Thanks"), return "NO_FACTS".
    - If it's a specific fact, summarize it concisely.
    
    Example Output: "User prefers Python for backend."
    """
    
    # Use a small/fast model for this (e.g., Llama-3-8b or Haiku) to save cost/time
    # Assuming 'llm' is your ChatGroq/OpenAI instance
    result = await llm.ainvoke([SystemMessage(content="You are a memory archivist."), HumanMessage(content=summary_prompt)])
    content = result.content.strip()

    # 2. Store only if useful
    if content != "NO_FACTS":
        print(f"🧠 [Background] Saving Memory: {content}")
        await memory_store.add(
            text=content,
            user_id=user_id,
            metadata={
                "source": "conversation_summary",
                "type": "automatic_memory"
            }
        )
    else:
        print(f"🗑️ [Background] Skipped trivial interaction.")