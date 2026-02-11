from app.agents.state import AgentState
from app.agents.tools import CLIENT_TOOLS, CLIENT_TOOL_NAMES, SERVER_TOOLS, SERVER_TOOL_NAMES, ALL_TOOLS
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from services.tool_registry import tool_retriever
import os

# 1. THE BRAIN (Reasoning & Conversation) - Gemini 2.5 Flash
# Note: We do NOT bind tools to this model.
brain_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.3, # Slightly higher for natural conversation
    convert_system_message_to_human=True 
)

# 2. THE HANDS (Tool Calling Expert) - Kimi
tool_llm = ChatGroq(
    model="moonshotai/kimi-k2-instruct-0905",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.0, # Zero temp for precise JSON generation
    max_retries=2,
)

# 3. THE RESEARCHER - Compound
search_llm = ChatGroq(
    model="groq/compound",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.0
)

# LangGraph Node for Server-Side Execution
tool_execution_node = ToolNode(SERVER_TOOLS)

async def brain_node(state: AgentState):
    profile = state.get("user_profile", "Unknown User")
    memories = state.get("vector_context", [])
    memory_str = "\n".join([f"- {m}" for m in memories]) if memories else "No relevant memories."
    
    is_tool_result = len(state["messages"]) > 0 and state["messages"][-1].type == "tool"

    system_prompt = f"""
    You are DeX, the "Brain" of a Personal Operating System.
    
    === USER CONTEXT ===
    • User: {profile}
    • Loaded Memories:
    {memory_str}

    === YOUR SUBSYSTEMS (CAPABILITIES) ===
    You do not execute actions yourself. Identify the user's intent and delegate to the correct specialist:
    
    1. **MEMORY & SEARCH SYS:** - Internal facts, user preferences, past conversations, and Web Search.
       - *Tools:* search_memory, save_memory, transfer_to_search.
       
    2. **PRODUCTIVITY SYS:** - Tasks, To-Do lists, Alarms, Timers, Calendar, and Deadlines.
       - *Tools:* create_task, get_tasks, set_alarm, set_timer.
       
    3. **HEALTH & BIOLOGY SYS:** - Water, Nutrition (Food/Calories), Sleep, Period Tracking, and Health Stats.
       - *Tools:* log_water, log_meal, log_period, get_health_dashboard, sleep_tracking.
       
    4. **FINANCE & ASSETS SYS:** - Expenses, Income, Bank Accounts, and Transactions.
       - *Tools:* add_transaction, get_accounts, create_account.
       
    5. **DEVICE & COMMS SYS:** - Phone Hardware (Apps, Volume), Calls, SMS, WhatsApp, and Music/Media.
       - *Tools:* open_app, play_media, call_contact, send_whatsapp.
       
    6. **LIFESTYLE & GROWTH SYS:** - Journaling, Content Watchlist (Movies/Books), and Developer Stats (GitHub).
       - *Tools:* save_journal, add_content, get_dev_profile.

    === DELEGATION PROTOCOL ===
    1. **IF ACTION REQUIRED:** Output `||DELEGATE||: <System Name> - <Instruction>`
       - *User:* "I spent 500 on food." 
         *Output:* `||DELEGATE||: FINANCE SYS - Log an expense of 500 for food.`
       - *User:* "I'm on my period." 
         *Output:* `||DELEGATE||: HEALTH SYS - Log period start today.`
       - *User:* "Play Taylor Swift."
         *Output:* `||DELEGATE||: DEVICE SYS - Play media song Taylor Swift.`

    2. **IF INFORMATION GAP:** Output `||DELEGATE||: MEMORY SYS - Search memory for <topic>.` OR `||SEARCH||: <query>` if it requires the web.

    3. **IF CONVERSATION:** Just reply naturally.
    
    { "✅ SYSTEM UPDATE: Tool execution finished. Use the results above to answer." if is_tool_result else "" }
    """
    
    messages = [SystemMessage(content=system_prompt)] + state["messages"]
    response = await brain_llm.ainvoke(messages)
    return {"messages": [response]}

async def action_mapping_node(state: AgentState):
    """
    Kimi: Receives the '||DELEGATE||' instruction, expands keywords, and picks the specific tool.
    """
    messages = state["messages"]
    last_message = messages[-1]
    
    raw_text = last_message.content.replace("||DELEGATE||:", "").strip()
    print(f"🤖 Kimi received instruction: '{raw_text}'")

    search_query = raw_text
    
    domain_map = {
        "MEMORY & SEARCH SYS": "search_memory save_memory retrieve remember fact context web internet",
        "PRODUCTIVITY SYS": "create_task update_task delete_task get_tasks section list alarm timer deadline schedule remind",
        "HEALTH & BIOLOGY SYS": "log_water log_meal get_nutrition calories kcal food eat drink log_period cycle menstruation health dashboard sleep steps",
        "FINANCE SYS": "add_transaction expense income money cost paid rupees bank account balance create_account",
        "DEVICE & COMMS SYS": "open_app launch play_media music song pause next call_contact phone send_whatsapp sms message text",
        "LIFESTYLE & GROWTH SYS": "save_journal diary write entry add_content movie book watch read github dev profile stats repo"
    }
    
    active_domain = "General"
    for domain, keywords in domain_map.items():
        if domain in raw_text:
            search_query += f" {keywords}"
            active_domain = domain
            print(f"🔹 Unpacking {domain} -> Added keywords")
            break

    print(f"🔎 Searching Tools for: '{search_query}'")

    relevant_tools = tool_retriever.query(search_query, k=10)
    
    current_names = {t.name for t in relevant_tools if t}
    
    if "create_task" in current_names and "create_section" not in current_names:
         relevant_tools.append(tool_retriever.tool_map.get("create_section"))
         
    if "log_meal" in current_names and "get_health_dashboard" not in current_names:
        relevant_tools.append(tool_retriever.tool_map.get("get_health_dashboard"))

    if "transfer_to_search" not in current_names:
        relevant_tools.append(tool_retriever.tool_map.get("transfer_to_search"))

    relevant_tools = [t for t in relevant_tools if t]

    print(f"🔧 Kimi Binding Tools: {[t.name for t in relevant_tools]}")

    llm_with_tools = tool_llm.bind_tools(relevant_tools, tool_choice="auto")
    
    kimi_prompt = f"""
    You are the Action Engine.
    The Brain requested: "{raw_text}"
    
    Domain: {active_domain}
    
    YOUR GOAL:
    1. Select the specific tool that matches the instruction.
    2. If the user provided specific data (like '500 rupees' or 'ate a burger'), use it in the arguments.
    3. If multiple actions are needed (e.g., 'Save Journal' AND 'Log Emotion'), call both.
    """
    
    # We send a fresh message to Kimi to avoid polluting it with the whole Gemini chat history
    response = await llm_with_tools.ainvoke([HumanMessage(content=kimi_prompt)])
    
    return {"messages": [response]}

async def search_node(state: AgentState):
    """Compound Model: Handles web searches."""
    messages = state["messages"]
    last_message = messages[-1]
    
    query = last_message.content.replace("||SEARCH||:", "").strip()
    print(f"🌍 Routing to Search Node for: {query}")
    
    search_prompt = "Provide a concise, factual answer. Use markdown links [Title](URL)."
    
    response = await search_llm.ainvoke([
        SystemMessage(content=search_prompt),
        HumanMessage(content=query)
    ])
    
    print(f"🌍 Search Node Output: {response.content}")

    return {"messages": [response]}

# --- ROUTING LOGIC ---

def router_brain(state: AgentState):
    """Decides where to go after Gemini speaks."""
    last_msg = state["messages"][-1].content.strip()
    
    if "||DELEGATE||:" in last_msg:
        return "map_action"
    elif "||SEARCH||:" in last_msg:
        return "search"
    else:
        return "end"

def router_action(state: AgentState):
    """Decides where to go after Kimi selects a tool."""
    last_msg = state["messages"][-1]
    
    if not hasattr(last_msg, "tool_calls") or not last_msg.tool_calls:
        # Kimi failed to pick a tool -> End or Error handling
        return "end"
    
    tool_calls = last_msg.tool_calls
    
    # If Search was selected via tool (fallback)
    if any(tc["name"] == "transfer_to_search" for tc in tool_calls):
        return "search"

    has_server = any(tc["name"] in SERVER_TOOL_NAMES for tc in tool_calls)
    has_client = any(tc["name"] in CLIENT_TOOL_NAMES for tc in tool_calls)

    if has_server:
        return "execute_server" # Go to ToolNode
    if has_client:
        return "end" # Return to React Native to execute
        
    return "end"

# --- GRAPH CONSTRUCTION ---

graph = StateGraph(AgentState)

# Nodes
graph.add_node("brain", brain_node)
graph.add_node("map_action", action_mapping_node)
graph.add_node("search", search_node)
graph.add_node("execute_server", tool_execution_node)

# Edges
graph.add_edge(START, "brain")

# Brain Routing
graph.add_conditional_edges(
    "brain", 
    router_brain, 
    {
        "map_action": "map_action",
        "search": "search",
        "end": END
    }
)

# Action Routing (Kimi)
graph.add_conditional_edges(
    "map_action",
    router_action,
    {
        "execute_server": "execute_server",
        "search": "search",
        "end": END
    }
)

# After Server Tools execute, feed result back to Brain for final confirmation
graph.add_edge("execute_server", "brain") 

# Search ends the turn
graph.add_edge("search", END)

app = graph.compile()