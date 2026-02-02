from app.agents.state import AgentState
from app.agents.tools import CLIENT_TOOLS, CLIENT_TOOL_NAMES, SERVER_TOOLS, SERVER_TOOL_NAMES, ALL_TOOLS
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from services.tool_registry import tool_retriever
from groq import AsyncGroq
import os

llm = ChatGroq(
    model="moonshotai/kimi-k2-instruct-0905",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.0,
    max_retries=1,
)

# Search LLM (Compound Model)
search_llm = ChatGroq(
    model="groq/compound",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.0
)

tool_node = ToolNode(SERVER_TOOLS)

async def chat_node(state: AgentState):
    profile = state.get("user_profile", "Unknown User")
    memories = state.get("vector_context", [])
    
    messages = state["messages"]
    last_user_message = next((m.content for m in reversed(messages) if m.type == "human"), "")

    if last_user_message:
        relevant_tools = tool_retriever.query(str(last_user_message), k=5)
        print(f"🔎 Retrieved tools for '{last_user_message}': {[t.name for t in relevant_tools]}")
        
        current_names = {t.name for t in relevant_tools}
        
        # Case 1: Has Task, needs Memory
        if "create_task" in current_names and "save_memory" not in current_names:
            if "save_memory" in tool_retriever.tool_map:
                relevant_tools.append(tool_retriever.tool_map["save_memory"])
                print("➕ Auto-injected 'save_memory' for context safety.")

        # Case 2: Has Memory, needs Task
        elif "save_memory" in current_names and "create_task" not in current_names:
            if "create_task" in tool_retriever.tool_map:
                relevant_tools.append(tool_retriever.tool_map["create_task"])
                print("➕ Auto-injected 'create_task' for context safety.")
        
        # Always inject Search capability
        if "transfer_to_search" in tool_retriever.tool_map and "transfer_to_search" not in current_names:
            relevant_tools.append(tool_retriever.tool_map["transfer_to_search"])
            print("➕ Auto-injected 'transfer_to_search' for global search availability.")

        print(f"🔎 Final Tools: {[t.name for t in relevant_tools]}")
        llm_with_tools = llm.bind_tools(relevant_tools, tool_choice="auto")
    else:
        llm_with_tools = llm.bind_tools(ALL_TOOLS, tool_choice="auto")


    memory_str = "\n".join([f"- {m}" for m in memories]) if memories else "No relevant memories."

    system_prompt_content = f"""
    You are DeX, an advanced Personal Operating System integrated directly into the user's life and device. Your goal is to be proactive, efficient, and context-aware.
    === #1. THE "NO GUESSING" RULE (CRITICAL) ===
    You have a context block below titled "RELEVANT MEMORIES".
    • **IF** the user asks a factual question (e.g., "Score of the match", "Location of event", "Price of X")...
    • **AND** the answer is NOT explicitly written in the "RELEVANT MEMORIES" block...
    • **THEN** you MUST use the `transfer_to_search` tool.
    
    ❌ DO NOT use your internal training data for recent events (Sports, News, Weather).
    ❌ DO NOT guess locations or dates.

    === #2. CORE DIRECTIVES (NON-NEGOTIABLE) ===
    1. **Personal First:** Queries about "apps", "databases", or "projects" refer to Rishik's personal work.
    2. **Memory is Truth:** Always check `search_memory` for internal queries. If `search_memory` returns a fact, that fact is the answer. only reply with what was do not ever add any extra information from the context.
    3. **No Generic Acknowledgments:** NEVER say "Got it", "I understand", "Thanks for the context". Just answer.
    4. **Action Over Talk:** If the user wants to do something, call the tool. Do not ask for permission unless parameters are missing.

    === #3. CURRENT CONTEXT ===
    • User Profile: {profile}
    • Recent Memories:
    {memory_str}

    === #4. DATE & TIME PROTOCOL ===
    • You are the source of truth for time. Calculate relative dates ("next Friday") based on the Current Time.

    === #5. TOOL USAGE PROTOCOL ===

    [A] RETRIEVAL TOOLS (search_memory, get_tasks, get_health)
    - **Usage:** Call these to get information.
    - **Output Rule:** The return value IS the answer.
    - **Example:** User: "What is the code for Project Alpha?"
      Tool Output: "Code: 8899"
      DeX Response: "The code for Project Alpha is 8899."

    [B] CLIENT TOOLS (Device Actions)
    - **Usage:** These trigger hardware (Alarm, Call, App).
    - **Output Rule:** Trigger the tool, then confirm briefly.
    - **Example:** "Calling Mom..." or "Opening Spotify."

    [C] CRITICAL REMINDER PROTOCOL
    If user sets a CRITICAL reminder with a specific time:
    1. Call `save_memory` (is_critical=True, due_time="...").
    2. IMMEDIATELY call `client_schedule_critical_memory` with the unix timestamp.

    === 5. INTENT MAPPING ===
    • "Remind me..." -> `client_set_alarm` OR `create_task`.
    • "Remember that..." -> `save_memory`.
    • "What is my..." -> `search_memory` or `get_journal_today`.
    • "Call [Name]" -> `client_call_contact`.

    Now, assist the user. Be direct and data-driven.
    """
    sys_msg = SystemMessage(content=system_prompt_content)
    full_prompt = [sys_msg] + state["messages"]

    response = await llm_with_tools.ainvoke(full_prompt)
    return {"messages": [response]}

async def search_node(state: AgentState):
    messages = state["messages"]
    last_message = messages[-1]
    
    # Extract query from tool call if available, else use last human message
    query = ""
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        if last_message.tool_calls[0]["name"] == "transfer_to_search":
            query = last_message.tool_calls[0]["args"].get("query", "")
    
    system_prompt = f"""
    RESPONSE RULES:
    1. **Be Concise & Direct:** Avoid long paragraphs unless deeply analyzing a complex topic.
    2. **Just the Facts:** Do not add "fluff" like "Here is what I found" or "I hope this helps."
    3. **Depth:** Only provide lengthy, detailed explanations if the user explicitly asks for an explanation or the topic is highly complex.
    4. **Important** Do not mention how the answer was obtained.
    5. **Links:** ALWAYS format links as `[Title](URL)`. Never output raw URLs.
    """
    
    if not query:
        query = next((m.content for m in reversed(messages) if m.type == "human"), "")

    print(f"🌍 Routing to Search Node for: {query}")
    
    # Direct invocation via LangChain
    response = await search_llm.ainvoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=query)
    ])
    
    return {"messages": [response]}
    

def should_continue(state: AgentState):
    """Decide whether to continue to tools or end."""
    messages = state["messages"]
    last_message = messages[-1]
    
    if not hasattr(last_message, "tool_calls") or not last_message.tool_calls:
        return "end"
    
    tool_calls = last_message.tool_calls
    
    if any(tc["name"] == "transfer_to_search" for tc in tool_calls):
        return "search"

    has_server_tools = any(tc["name"] in SERVER_TOOL_NAMES for tc in tool_calls)
    has_client_tools = any(tc["name"] in CLIENT_TOOL_NAMES for tc in tool_calls)

    if has_server_tools:
        return "tools"
        
    if has_client_tools:
        return "end"
    
    return "end"

# Build the graph
graph = StateGraph(AgentState)
graph.add_node("llm", chat_node)
graph.add_node("tools", tool_node)
graph.add_node("search", search_node)

graph.add_edge(START, "llm")
graph.add_conditional_edges("llm", should_continue, {"tools": "tools", "search": "search", "end": END})
graph.add_edge("tools", "llm")  # After tool execution, go back to LLM
graph.add_edge("search", END)   # After search, end

app = graph.compile()