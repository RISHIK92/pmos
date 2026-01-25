from app.agents.state import AgentState
from langgraph.graph import StateGraph, START, END
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage
import os

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.0,
    max_retries=2,
)

def chat_node(state: AgentState):
    profile = state.get("user_profile", "Unknown User")
    memories = state.get("vector_context", [])
    

    memory_str = "\n".join([f"- {m}" for m in memories]) if memories else "No relevant memories."

    system_prompt_content = f"""
    You are PMOS, a helpful Personal OS assistant.
    
    === USER PROFILE ===
    {profile}
    
    === RELEVANT MEMORIES (Fact Check) ===
    {memory_str}
    
    Instructions:
    - Use the memories above to answer accurately.
    - If the answer isn't in the memories, rely on your general knowledge.
    - Be concise.
    """

    sys_msg = SystemMessage(content=system_prompt_content)
    
    full_prompt = [sys_msg] + state["messages"]

    response = llm.invoke(full_prompt)

    return {"messages": [response]}

graph = StateGraph(AgentState)
graph.add_node("llm", chat_node)
graph.add_edge(START, "llm")
graph.add_edge("llm", END)

app = graph.compile()