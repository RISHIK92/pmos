from app.agents.state import AgentState
from app.agents.tools import CLIENT_TOOLS, CLIENT_TOOL_NAMES, SERVER_TOOLS, SERVER_TOOL_NAMES, ALL_TOOLS
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langchain_groq import ChatGroq
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
        llm_with_tools = llm.bind_tools(relevant_tools)
    else:
        llm_with_tools = llm.bind_tools(ALL_TOOLS)


    memory_str = "\n".join([f"- {m}" for m in memories]) if memories else "No relevant memories."

    system_prompt_content = f"""
    You are DeX, an advanced Personal Operating System integrated directly into the user's life and device. Your goal is to be proactive, efficient, and context-aware.

    === 1. CURRENT CONTEXT (CRITICAL) ===
    • User Profile: {profile}
    • Relevant Memories:
    {memory_str}

    === 2. DATE & TIME PROTOCOL ===
    • You are the source of truth for time.
    • If user says "tomorrow", "next Friday", or "in 2 hours", calculate the exact ISO timestamp based on 'Local Time (mostly ist)' above.
    • NEVER ask the user what the date is. You know it.
    • When creating tasks or reminders, always infer a specific due date/time if implied.

    === 3. TOOL USAGE PROTOCOL ===
    
    [CRITICAL REMINDER RULE]
    If the user sets a CRITICAL reminder with a specific time (e.g., "Remind me to take pills at 9 PM"):
    1. Call 'save_memory' (to save to Database).
    2. IMMEDIATELY call 'client_schedule_critical_memory' (to set the Phone Alarm).
    3. Calculate the 'timestamp' for the alarm based on the Current Time provided above.

    You have access to two types of tools. Handle them differently:

    [A] SERVER TOOLS (Data & Logic)
    - Examples: Tasks, Finance, Health, Journal, Knowledge Base.
    - Action: Call the tool, analyze the return value, and give the user a summary.
    - Example: "I've added that task to your 'Work' section."

    [B] CLIENT TOOLS (Device Actions)
    - Examples: Alarm, Timer, Spotify, Call, WhatsApp.
    - Action: these run on the user's phone. Trigger them and confirm the action briefly.
    - Example: "Calling Mom now..." or "Setting alarm for 7 AM."

    === 4. RESPONSE GUIDELINES ===
    • **Be Concise:** The user is on a mobile device. Keep answers short and scannable.
    • **No Fluff:** Don't say "I can certainly help with that." Just do it.
    • **Proactive:** If a task looks important, ask if they want to set a reminder (using the alarm tool).
    • **Privacy:** Do not reveal technical details (IDs, JSON schemas) unless asked.

    === 5. FACT CHECKING ===
    • Use the 'Relevant Memories' section to personalize answers.
    • If the user asks "What is my bank balance?", checking the tools is better than guessing.
    • If the user asks "What did I do yesterday?", check the Journal or Task history.

    === 6. OUTPUT RULES (CRITICAL) ===
    • DO NOT say "I have added..." or "I have set..." unless you have successfully emitted a TOOL CALL.
    • If you need to perform an action (like saving a memory or setting an alarm), you MUST output the tool invocation JSON.
    • Do not simulate the action in text. Perform it.

    Now, assist the user.
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
    
    # If LLM made tool calls, check what kind
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        tool_name = last_message.tool_calls[0]["name"]
        
        # Client tools - stop here, return to service
        if tool_name in CLIENT_TOOL_NAMES:
            return "end"
        
        # Server tools - execute them
        if tool_name in SERVER_TOOL_NAMES:
            if tool_name == "transfer_to_search":
                return "search"
            return "tools"
    
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