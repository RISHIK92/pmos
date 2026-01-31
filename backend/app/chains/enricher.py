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
    You are an Intent Enricher for a Personal OS.
    
    === CONVERSATION HISTORY ===
    {history_text}
    
    === CURRENT USER INPUT ===
    "{raw_query}"
    
    === YOUR TASK ===
    Clarify the user's input for the Agent, BUT preserve the core intent (Action vs. Search).
    
    RULES:
    1. **If it is a Command (Task/Reminder):** Keep it as a command. specificy the date/time if implied.
       - "study dva tomorrow" -> "Create a task to study DVA tomorrow by 11pm"
       - "remind me to call mom" -> "Set a reminder to call Mom"
    2. **If it is a Search/Question:** Expand it for clarity.
       - "gym code" -> "What is the passcode for my gym locker?"
    3. **Resolve Pronouns:** Use history to replace "he", "it", "that".
    
    Output the refined string only.
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