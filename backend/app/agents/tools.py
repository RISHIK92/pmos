from langchain_core.tools import tool
from langchain_core.runnables import RunnableConfig
from typing import Optional, Literal, List
from core.lifespan import db
from datetime import datetime


try:
    from pydantic.v1 import BaseModel, Field
except ImportError:
    from pydantic import BaseModel, Field
# ============================================
# CLIENT TOOLS (Executed on phone)
# ============================================

class CallContactArgs(BaseModel):
    name: str = Field(description="Name of the person to call (e.g. 'Mom', 'John', 'Dr. Smith')")

class OpenAppArgs(BaseModel):
    app_name: str = Field(description="Name of the app (e.g. 'Spotify', 'Settings', 'YouTube', 'WhatsApp')")

class SetAlarmArgs(BaseModel):
    time: str = Field(description="Time for the alarm (e.g. '7:00 AM', '6:30 PM', '14:00')")
    label: Optional[str] = Field(default=None, description="Optional label for the alarm")

class SetTimerArgs(BaseModel):
    duration: str = Field(description="Duration for timer (e.g. '5 minutes', '1 hour', '30 seconds')")

class PlayMediaArgs(BaseModel):
    action: Literal["play", "pause", "next", "previous"] = Field(description="Media action to perform")
    song_name: Optional[str] = Field(default=None, description="Name of the song to play (only for 'play' action)")

class SendWhatsAppArgs(BaseModel):
    contact_name: str = Field(description="Name of the contact")
    message: str = Field(description="Message content to send")

class SendSmsArgs(BaseModel):
    contact_name: str = Field(description="Name of the contact")
    message: str = Field(description="Message content to send")

class SleepTrackingArgs(BaseModel):
    action: Literal["start", "stop"] = Field(description="'start' when going to sleep, 'stop' when waking up")

class ScheduleCriticalMemoryArgs(BaseModel):
    title: str = Field(description="Title of the reminder")
    timestamp: int = Field(description="Unix timestamp (in milliseconds) when the alarm should ring")

@tool(args_schema=CallContactArgs)
def client_call_contact(name: str) -> str:
    """Initiate a phone call to a contact by name. Use this when user wants to call someone."""
    return f"Calling {name}"

@tool(args_schema=OpenAppArgs)
def client_open_app(app_name: str) -> str:
    """Open or launch an application on the phone. Use this when user wants to open an app."""
    return f"Opening {app_name}"

@tool(args_schema=SetAlarmArgs)
def client_set_alarm(time: str, label: Optional[str] = None) -> str:
    """Set an alarm for a specific time. Use this when user wants to set an alarm."""
    return f"Setting alarm for {time}"

@tool(args_schema=SetTimerArgs)
def client_set_timer(duration: str) -> str:
    """Set a countdown timer. Use this when user wants to set a timer for a duration."""
    return f"Setting timer for {duration}"

@tool(args_schema=PlayMediaArgs)
def client_play_media(action: str, song_name: Optional[str] = None) -> str:
    """Play music or control media playback. Use this for playing songs or media controls."""
    if song_name:
        return f"Playing {song_name}"
    return f"Media action: {action}"

@tool(args_schema=SendWhatsAppArgs)
def client_send_whatsapp(contact_name: str, message: str) -> str:
    """Send a WhatsApp message to a contact. Use this when user wants to send a WhatsApp message."""
    return f"Sending WhatsApp to {contact_name}"

@tool(args_schema=SendSmsArgs)
def client_send_sms(contact_name: str, message: str) -> str:
    """Send an SMS text message. Use this when user wants to send a text/SMS."""
    return f"Sending SMS to {contact_name}"

@tool(args_schema=SleepTrackingArgs)
def client_sleep_tracking(action: str) -> str:
    """Start or stop sleep tracking. Use when user says they're going to sleep or waking up."""
    return f"Sleep tracking: {action}"

@tool(args_schema=ScheduleCriticalMemoryArgs)
def client_schedule_critical_memory(title: str, timestamp: int) -> str:
    """
    Trigger a native critical alarm on the phone.
    Use this immediately after saving a critical memory that has a specific time.
    """
    return f"Scheduling critical alarm for {title}"

CLIENT_TOOLS = [
    client_call_contact,
    client_open_app,
    client_set_alarm,
    client_set_timer,
    client_play_media,
    client_send_whatsapp,
    client_send_sms,
    client_sleep_tracking,
    client_schedule_critical_memory,
]

CLIENT_TOOL_NAMES = [t.name for t in CLIENT_TOOLS]


# ============================================
# SERVER TOOLS (Executed on backend)
# User ID is injected via RunnableConfig
# ============================================

# --- Helper to extract user_id from config ---
def get_user_id(config: RunnableConfig) -> str:
    return config.get("configurable", {}).get("user_id", "")


# --- Tasks ---
class CreateTaskArgs(BaseModel):
    title: str = Field(description="Title of the task")
    section_name: Optional[str] = Field(default="General", description="Section (Work, Personal, Coding)")
    due_date: str = Field(description="REQUIRED: Due date in YYYY-MM-DD format")
    due_time: Optional[str] = Field(default=None, description="Due time in HH:MM format")

class CreateSectionArgs(BaseModel):
    title: str = Field(description="Title of the section (e.g. 'Work', 'Personal', 'Shopping')")
    icon: Optional[str] = Field(default="📋", description="Emoji icon for the section")
    color: Optional[str] = Field(default="#4285F4", description="Color hex code for the section")

class UpdateTaskArgs(BaseModel):
    task_title: str = Field(description="Current title of the task to update (search term)")
    new_title: Optional[str] = Field(default=None, description="New title for the task")
    new_due_date: Optional[str] = Field(default=None, description="New due date in YYYY-MM-DD format")
    new_due_time: Optional[str] = Field(default=None, description="New due time in HH:MM format")
    status: Optional[Literal["todo", "in_progress", "done"]] = Field(default=None, description="New status")

class CompleteTaskArgs(BaseModel):
    task_title: str = Field(description="Title of the task to mark as complete (search term)")

class DeleteTaskArgs(BaseModel):
    task_title: str = Field(description="Title of the task to delete (search term)")

class RescheduleTaskArgs(BaseModel):
    task_title: str = Field(description="Title of the task to reschedule (search term)")
    new_due_date: str = Field(description="New due date in YYYY-MM-DD format")
    new_due_time: Optional[str] = Field(default=None, description="New due time in HH:MM format")

# --- Journal ---
class SaveJournalArgs(BaseModel):
    content: str = Field(description="Journal content/entry text")
    date: Optional[str] = Field(default=None, description="Date in YYYY-MM-DD format, defaults to today")

# --- Health ---
class LogWaterArgs(BaseModel):
    amount: int = Field(description="Amount of water in ml (e.g. 250, 500)")

# --- Finance ---
class AddTransactionArgs(BaseModel):
    amount: float = Field(description="Transaction amount")
    payee: str = Field(description="Who the money is paid to or received from")
    category: str = Field(description="Category like 'Food', 'Transport', 'Shopping', 'Salary'")
    type: Literal["expense", "income"] = Field(description="Type of transaction")

# --- Memory ---
class SaveMemoryArgs(BaseModel):
    title: str = Field(description="Title of the memory/note")
    content: str = Field(description="Content of the memory")
    tags: Optional[str] = Field(default=None, description="Comma-separated tags")
    is_critical: Optional[bool] = Field(default=False, description="Set to true if this is critical/important information")
    due_date: Optional[str] = Field(default=None, description="Reminder date (YYYY-MM-DD)")
    due_time: Optional[str] = Field(default=None, description="Reminder time (HH:MM)")

# --- Accounts ---
class CreateAccountArgs(BaseModel):
    name: str = Field(description="Name of the account (e.g. 'HDFC Savings', 'Cash')")
    balance: float = Field(description="Initial balance")
    account_number: Optional[str] = Field(default=None, description="Account number (optional)")

class UpdateAccountArgs(BaseModel):
    account_name: str = Field(description="Name of the account to update")
    new_balance: Optional[float] = Field(default=None, description="New balance")
    new_name: Optional[str] = Field(default=None, description="New account name")

# --- Period ---
class LogPeriodArgs(BaseModel):
    date: Optional[str] = Field(default=None, description="Start date in YYYY-MM-DD format, defaults to today")

# --- Nutrition ---
class LogMealArgs(BaseModel):
    name: str = Field(description="Name of the meal/food item")
    kcal: int = Field(description="Calories in the meal")
    meal_type: Literal["breakfast", "lunch", "dinner", "snack"] = Field(description="Type of meal")
    date: Optional[str] = Field(default=None, description="Date in YYYY-MM-DD format, defaults to today")

class DeleteMealArgs(BaseModel):
    meal_name: str = Field(description="Name of the meal to delete (search term)")

# --- Content ---
class AddContentArgs(BaseModel):
    type: Literal["WATCH", "READ", "SOCIAL"] = Field(description="Type of content: WATCH (Movie/Video), READ (Book/Article), SOCIAL (Post/Tweet)")
    title: str = Field(description="Title of the content")
    subtitle: Optional[str] = Field(default=None, description="Subtitle or description")
    platform: Optional[str] = Field(description="Platform (e.g. YouTube, Netflix, Medium, General)")
    url: Optional[str] = Field(default=None, description="URL to the content")

class TransferToSearchArgs(BaseModel):
    query: str = Field(description="Query to search for. Be specific.")


# ============================================
# TASK TOOLS
# ============================================

@tool
async def get_tasks(config: RunnableConfig) -> str:
    """Get all tasks and sections for the user. Use when user asks about their tasks or to-do list."""
    user_id = get_user_id(config)
    sections = await db.tasksection.find_many(
        where={"userId": user_id},
        include={"tasks": {"order_by": {"createdAt": "desc"}}},
        order={"createdAt": "asc"}
    )
    
    if not sections:
        return "You have no task sections yet. Create some sections first!"
    
    result = []
    for section in sections:
        tasks_str = "\n".join([f"  - {'✓' if t.status == 'done' else '○'} {t.title}" for t in section.tasks]) or "  No tasks"
        result.append(f"📁 {section.title}:\n{tasks_str}")
    
    return "\n\n".join(result)

@tool(args_schema=CreateSectionArgs)
async def create_section(title: str, icon: Optional[str] = "📋", color: Optional[str] = "#4285F4", *, config: RunnableConfig) -> str:
    """Create a new task section/category. Use when user wants to organize tasks into a new category."""
    user_id = get_user_id(config)
    
    # Check if section already exists
    existing = await db.tasksection.find_first(
        where={"userId": user_id, "title": {"equals": title, "mode": "insensitive"}}
    )
    if existing:
        return f"Section '{title}' already exists!"
    
    section = await db.tasksection.create(
        data={
            "userId": user_id,
            "title": title,
            "icon": icon,
            "color": color
        }
    )
    return f"📁 Created section: '{title}'"

@tool(args_schema=CreateTaskArgs)
async def create_task(title: str, section_name: str = "General", due_date: Optional[str] = None, due_time: Optional[str] = None, *, config: RunnableConfig) -> str:
    """
    Create a formal 'Task Manager' style to-do item. MUST have a deadline or be part of a project.
    
    Use this for:
    - "Submit report by Friday" (Work)
    - "Finish Python script" (Coding)
    - "Pay electricity bill before 5th" (Deadline)
    
    Do NOT use this for daily habits (taking pills) or static facts - use save_memory for those.
    """
    user_id = get_user_id(config)
    
    section = await db.tasksection.find_first(where={"userId": user_id, "title": {"equals": section_name, "mode": "insensitive"}})
    if not section:
        section = await db.tasksection.create(data={"userId": user_id, "title": section_name, "icon": "📋", "color": "#4285F4"})
    
    await db.task.create(
        data={"sectionId": section.id, "title": title, "status": "todo", "dueDate": due_date, "dueTime": due_time}
    )
    return f"✅ Created Task: '{title}' in {section.title} (Due: {due_date or 'No Date'})"


@tool(args_schema=UpdateTaskArgs)
async def update_task(task_title: str, new_title: Optional[str] = None, new_due_date: Optional[str] = None, new_due_time: Optional[str] = None, status: Optional[str] = None, *, config: RunnableConfig) -> str:
    """Update an existing task. Use when user wants to modify a task's title, due date, or status."""
    user_id = get_user_id(config)
    sections = await db.tasksection.find_many(
        where={"userId": user_id},
        include={"tasks": True}
    )
    
    found_task = None
    for section in sections:
        for task in section.tasks:
            if task_title.lower() in task.title.lower():
                found_task = task
            if found_task: break
        if found_task: break
    
    if not found_task:
        return f"❌ Task containing '{task_title}' not found."
    
    update_data = {}
    if new_title:
        update_data["title"] = new_title
    if new_due_date:
        update_data["dueDate"] = new_due_date
    if new_due_time:
        update_data["dueTime"] = new_due_time
    if status:
        update_data["status"] = status
    
    if not update_data:
        return "No updates specified."
    
    await db.task.update(where={"id": found_task.id}, data=update_data)
    return f"✅ Updated task: '{found_task.title}'"

@tool(args_schema=CompleteTaskArgs)
async def complete_task(task_title: str, *, config: RunnableConfig) -> str:
    """Mark a task as complete/done. Use when user says they finished a task."""
    user_id = get_user_id(config)
    sections = await db.tasksection.find_many(
        where={"userId": user_id},
        include={"tasks": True}
    )
    
    found_task = None
    for section in sections:
        for task in section.tasks:
            if task_title.lower() in task.title.lower():
                found_task = task
            if found_task: break
        if found_task: break
    
    if not found_task:
        return f"❌ Task containing '{task_title}' not found."
    
    await db.task.update(where={"id": found_task.id}, data={"status": "done"})
    return f"✅ Marked '{found_task.title}' as complete!"

@tool(args_schema=DeleteTaskArgs)
async def delete_task(task_title: str, *, config: RunnableConfig) -> str:
    """Delete a task. Use when user wants to remove a task."""
    user_id = get_user_id(config)
    sections = await db.tasksection.find_many(
        where={"userId": user_id},
        include={"tasks": True}
    )
    
    found_task = None
    for section in sections:
        for task in section.tasks:
            if task_title.lower() in task.title.lower():
                found_task = task
            if found_task: break
        if found_task: break
    
    if not found_task:
        return f"❌ Task containing '{task_title}' not found."
    
    await db.task.delete(where={"id": found_task.id})
    return f"🗑️ Deleted task: '{found_task.title}'"

@tool(args_schema=RescheduleTaskArgs)
async def reschedule_task(task_title: str, new_due_date: str, new_due_time: Optional[str] = None, *, config: RunnableConfig) -> str:
    """Reschedule a task to a new date/time. Use when user wants to move a task to a different time."""
    user_id = get_user_id(config)
    sections = await db.tasksection.find_many(
        where={"userId": user_id},
        include={"tasks": True}
    )
    
    found_task = None
    section_id = None
    for section in sections:
        for task in section.tasks:
            if task_title.lower() in task.title.lower():
                found_task = task
                section_id = section.id
            if found_task: break
        if found_task: break
    
    if not found_task:
        return f"❌ Task containing '{task_title}' not found."
    
    try:
        await db.task.update(
            where={"id": found_task.id},
            data={"dueDate": new_due_date, "dueTime": new_due_time}
        )
        return f"📅 Rescheduled '{found_task.title}' to {new_due_date}" + (f" at {new_due_time}" if new_due_time else "")
    except Exception:
        await db.task.delete(where={"id": found_task.id})
        await db.task.create(
            data={
                "sectionId": section_id,
                "title": found_task.title,
                "status": found_task.status,
                "dueDate": new_due_date,
                "dueTime": new_due_time
            }
        )
        return f"📅 Rescheduled '{found_task.title}' to {new_due_date}" + (f" at {new_due_time}" if new_due_time else "")


# ============================================
# JOURNAL TOOLS
# ============================================

@tool
async def get_journal_today(config: RunnableConfig) -> str:
    """Get today's journal entry. Use when user asks about their journal or what they wrote today."""
    user_id = get_user_id(config)
    today = datetime.now().strftime("%Y-%m-%d")
    journal = await db.dailyjournal.find_first(
        where={"userId": user_id, "date": today, "type": "PERSONAL"}
    )
    
    if not journal:
        return "No journal entry for today yet."
    
    return f"📖 Today's Journal ({today}):\n{journal.content}"

@tool(args_schema=SaveJournalArgs)
async def save_journal(content: str, date: Optional[str] = None, *, config: RunnableConfig) -> str:
    """Save or update a journal entry. Use when user wants to write in their journal."""
    user_id = get_user_id(config)
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    
    await db.dailyjournal.upsert(
        where={"userId_date_type": {"userId": user_id, "date": target_date, "type": "PERSONAL"}},
        data={
            "create": {"userId": user_id, "date": target_date, "content": content, "type": "PERSONAL"},
            "update": {"content": content}
        }
    )
    return f"📝 Journal saved for {target_date}"


# ============================================
# HEALTH TOOLS
# ============================================

@tool
async def get_health_dashboard(config: RunnableConfig) -> str:
    """Get today's health stats (Steps & Water). Use when user asks about their health, steps, water intake, or progress."""
    user_id = get_user_id(config)
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Fetch Water and Daily Steps goals
    goals = await db.goal.find_many(
        where={
            "userId": user_id,
            "title": {"in": ["Water", "Daily Steps"]}
        },
        include={
            "logs": {"where": {"date": today}}
        }
    )
    
    steps_val = 0
    water_val = 0
    steps_target = 10000
    water_target = 2000
    
    for g in goals:
        current = g.logs[0].current if g.logs else 0
        if g.title == "Water":
            water_val = current
            water_target = g.target
        elif g.title == "Daily Steps":
            steps_val = current
            steps_target = g.target
            
    return f"""🏃 Today's Health ({today}):
• Steps: {steps_val} / {steps_target}
• Water: {water_val}ml / {water_target}ml
• Goal Progress: Check the app for details"""

@tool(args_schema=LogWaterArgs)
async def log_water(amount: int, *, config: RunnableConfig) -> str:
    """Log water intake. Use when user says they drank water."""
    user_id = get_user_id(config)
    today = datetime.now().strftime("%Y-%m-%d")
    
    # 1. Ensure "Hydration" goal exists
    water_goal = await db.goal.find_first(
        where={"userId": user_id, "title": "Water"}
    )
    
    if not water_goal:
        water_goal = await db.goal.create(
            data={
                "userId": user_id,
                "title": "Water",
                "target": 2000, # Default 2000ml
                "unit": "ml",
                "icon": "drop.fill",
                "category": "health",
                "isSystem": True
            }
        )
    
    # 2. Get today's log or create it
    current_log = await db.goallog.find_unique(
        where={"goalId_date": {"goalId": water_goal.id, "date": today}}
    )
    
    new_val = amount
    if current_log:
        new_val += current_log.current
        await db.goallog.update(
            where={"id": current_log.id},
            data={"current": new_val}
        )
    else:
        await db.goallog.create(
            data={
                "userId": user_id,
                "goalId": water_goal.id,
                "date": today,
                "current": new_val
            }
        )

    return f"💧 Logged {amount}ml water. Total today: {new_val}ml / {water_goal.target}ml"


# ============================================
# FINANCE TOOLS
# ============================================

@tool
async def get_transactions(config: RunnableConfig) -> str:
    """Get recent transactions. Use when user asks about their expenses, spending, or transactions."""
    user_id = get_user_id(config)
    transactions = await db.transaction.find_many(
        where={"userId": user_id},
        order={"createdAt": "desc"},
        take=10
    )
    
    if not transactions:
        return "No transactions found."
    
    result = ["💰 Recent Transactions:"]
    for t in transactions:
        sign = "+" if t.type == "income" else "-"
        result.append(f"  {sign}₹{t.amount} {t.payee} ({t.category})")
    
    return "\n".join(result)

@tool(args_schema=AddTransactionArgs)
async def add_transaction(amount: float, payee: str, category: str, type: str, *, config: RunnableConfig) -> str:
    """Log a financial transaction, expense, or income. Use this when the user spent money, paid for something, or received money. Keywords: cost, price, rupees, paid."""
    user_id = get_user_id(config)
    await db.transaction.create(
        data={
            "userId": user_id,
            "amount": amount,
            "payee": payee,
            "category": category,
            "type": type,
            "icon": "banknote",
            "iconBg": "#000000"
        }
    )
    sign = "+" if type == "income" else "-"
    return f"💵 Added {type}: {sign}₹{amount} - {payee} ({category})"


# ============================================
# MEMORY TOOLS
# ============================================

@tool
async def get_memories(config: RunnableConfig) -> str:
    """Get saved memories/notes. Use when user asks about their memories or saved notes."""
    user_id = get_user_id(config)
    memories = await db.memory.find_many(
        where={"userId": user_id},
        order={"createdAt": "desc"},
        take=10
    )
    
    if not memories:
        return "No memories saved yet."
    
    result = ["🧠 Your Memories:"]
    for m in memories:
        result.append(f"  • {m.title}: {m.content[:50]}...")
    
    return "\n".join(result)

@tool(args_schema=SaveMemoryArgs)
async def save_memory(title: str, content: str, tags: Optional[str] = None, is_critical: Optional[bool] = False, due_date: Optional[str] = None, due_time: Optional[str] = None, *, config: RunnableConfig) -> str:
    """
    Store information, habits, or critical health reminders.
    
    IMPORTANT RULE: 
    If 'is_critical' is True AND a specific time is provided (reminder_time), 
    you MUST ALSO call the 'client_schedule_critical_memory' tool to ring the phone.
    """
    user_id = get_user_id(config)
    if not user_id: return "❌ Error: User not found."

    tags_list = []
    if tags:
        tags_list = [t.strip() for t in tags.split(",") if t.strip()]

    await db.memory.create(
        data={
            "userId": user_id,
            "title": title,
            "content": content,
            "tags": tags_list,
            "isCritical": is_critical or False,
            "reminderDate": due_date,
            "reminderTime": due_time
        }
    )
    
    reminder_str = f" (Reminder: {due_date} {due_time})" if due_date or due_time else ""
    return f"🧠 Saved: '{title}'" + (" (Critical!)" if is_critical else "") + reminder_str


# ============================================
# BANK ACCOUNTS TOOLS
# ============================================

@tool
async def get_accounts(config: RunnableConfig) -> str:
    """Get all bank accounts. Use when user asks about their accounts or balances."""
    user_id = get_user_id(config)
    accounts = await db.bankaccount.find_many(
        where={"userId": user_id},
        order={"createdAt": "asc"}
    )
    
    if not accounts:
        return "No bank accounts found. Add one first!"
    
    result = ["🏦 Your Accounts:"]
    total = 0
    for acc in accounts:
        result.append(f"  • {acc.name}: ₹{acc.balance}")
        total += acc.balance
    result.append(f"\n💰 Total: ₹{total}")
    
    return "\n".join(result)

@tool(args_schema=CreateAccountArgs)
async def create_account(name: str, balance: float, account_number: Optional[str] = None, *, config: RunnableConfig) -> str:
    """Create a new bank account. Use when user wants to add a bank account."""
    user_id = get_user_id(config)
    await db.bankaccount.create(
        data={
            "userId": user_id,
            "name": name,
            "balance": balance,
            "accountNumber": account_number or "",
            "color": "#4285F4"
        }
    )
    return f"🏦 Created account: '{name}' with ₹{balance}"

@tool(args_schema=UpdateAccountArgs)
async def update_account(account_name: str, new_balance: Optional[float] = None, new_name: Optional[str] = None, *, config: RunnableConfig) -> str:
    """Update a bank account. Use when user wants to change account balance or name."""
    user_id = get_user_id(config)
    account = await db.bankaccount.find_first(
        where={"userId": user_id, "name": {"contains": account_name, "mode": "insensitive"}}
    )
    
    if not account:
        return f"❌ Account '{account_name}' not found."
    
    update_data = {}
    if new_balance is not None:
        update_data["balance"] = new_balance
    if new_name:
        update_data["name"] = new_name
    
    if not update_data:
        return "No updates specified."
    
    await db.bankaccount.update(where={"id": account.id}, data=update_data)
    return f"✅ Updated account: '{account.name}'"


# ============================================
# DEV PROFILE TOOLS
# ============================================

@tool
async def get_dev_profile(config: RunnableConfig) -> str:
    """Get GitHub developer profile and stats. Use when user asks about their dev profile, repos, or coding stats."""
    user_id = get_user_id(config)
    user = await db.user.find_unique(where={"id": user_id})
    
    if not user or not user.githubToken:
        return "GitHub not connected. Please connect your GitHub account in settings."
    
    import httpx
    headers = {"Authorization": f"Bearer {user.githubToken}", "Accept": "application/vnd.github.v3+json"}
    
    async with httpx.AsyncClient() as client:
        profile_resp = await client.get("https://api.github.com/user", headers=headers)
        if profile_resp.status_code != 200:
            return "Failed to fetch GitHub profile."
        
        profile = profile_resp.json()
        
        repos_resp = await client.get("https://api.github.com/user/repos?sort=updated&per_page=5", headers=headers)
        repos = repos_resp.json() if repos_resp.status_code == 200 else []
    
    repos_str = "\n".join([f"  • {r['name']} ({r['language'] or 'N/A'})" for r in repos[:5]])
    
    return f"""👨‍💻 GitHub Profile: {profile['login']}
: Public Repos: {profile['public_repos']}
👥 Followers: {profile['followers']} | Following: {profile['following']}

📁 Recent Repos:
{repos_str}"""


# ============================================
# PERIOD TRACKING TOOLS
# ============================================

@tool(args_schema=LogPeriodArgs)
async def log_period(date: Optional[str] = None, *, config: RunnableConfig) -> str:
    """Log period start date. Use when user says their period started."""
    user_id = get_user_id(config)
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    
    existing = await db.periodcycle.find_first(
        where={"userId": user_id, "startDate": target_date}
    )
    
    if existing:
        return f"📅 Period already logged for {target_date}"
    
    await db.periodcycle.create(
        data={"userId": user_id, "startDate": target_date}
    )
    return f"🩸 Logged period start: {target_date}"

@tool
async def get_period_info(config: RunnableConfig) -> str:
    """Get period tracking info and predictions. Use when user asks about their period, cycle, or next period date."""
    from datetime import timedelta
    user_id = get_user_id(config)
    
    user = await db.user.find_unique(where={"id": user_id})
    if not user or user.gender != "female":
        return "Period tracking is only available for users with gender set to female."
    
    cycles = await db.periodcycle.find_many(
        where={"userId": user_id},
        order={"startDate": "desc"},
        take=3
    )
    
    if not cycles:
        return "No period data logged yet. Say 'log period' when your period starts."
    
    last_cycle = cycles[0]
    last_start = datetime.strptime(last_cycle.startDate, "%Y-%m-%d")
    next_date = last_start + timedelta(days=28)
    
    today = datetime.now()
    days_until = (next_date - today).days
    
    status = "On time"
    if days_until < 0:
        status = f"{abs(days_until)} days late"
    elif days_until <= 3:
        status = "Due soon"
    
    return f"""🩸 Period Tracker
Last Period: {last_cycle.startDate}
Next Expected: {next_date.strftime('%Y-%m-%d')}
Status: {status}
Days Until: {days_until if days_until > 0 else 'Overdue'}"""


# ============================================
# NUTRITION/MEALS TOOLS
# ============================================

@tool(args_schema=LogMealArgs)
async def log_meal(name: str, kcal: int, meal_type: str, date: Optional[str] = None, *, config: RunnableConfig) -> str:
    """Log nutritional intake and food consumption for health tracking. Use ONLY when the user is eating or tracking calories. Do NOT use for buying food."""
    user_id = get_user_id(config)
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    
    log = await db.dailylog.find_first(
        where={"userId": user_id, "date": target_date}
    )
    
    if not log:
        log = await db.dailylog.create(
            data={"userId": user_id, "date": target_date, "goal": 2200}
        )
    
    await db.mealitem.create(
        data={
            "dailyLogId": log.id,
            "name": name,
            "kcal": kcal,
            "type": meal_type,
            "time": datetime.now().strftime("%H:%M")
        }
    )
    return f"🍽️ Logged {meal_type}: {name} ({kcal} kcal)"

@tool
async def get_nutrition_today(config: RunnableConfig) -> str:
    """Get today's meals and calorie intake. Use when user asks about their food, meals, or calories today."""
    user_id = get_user_id(config)
    today = datetime.now().strftime("%Y-%m-%d")
    
    log = await db.dailylog.find_first(
        where={"userId": user_id, "date": today},
        include={"meals": True}
    )
    
    if not log or not log.meals:
        return "No meals logged today yet."
    
    total_kcal = sum(m.kcal for m in log.meals)
    remaining = log.goal - total_kcal
    
    meals_str = "\n".join([f"  • {m.name}: {m.kcal} kcal ({m.type})" for m in log.meals])
    
    return f"""🍽️ Today's Nutrition ({today}):
{meals_str}

📊 Total: {total_kcal} / {log.goal} kcal
{"✅ " + str(remaining) + " kcal remaining" if remaining > 0 else "⚠️ Over by " + str(abs(remaining)) + " kcal"}"""

@tool(args_schema=DeleteMealArgs)
async def delete_meal(meal_name: str, *, config: RunnableConfig) -> str:
    """Delete a logged meal. Use when user wants to remove a meal entry."""
    user_id = get_user_id(config)
    today = datetime.now().strftime("%Y-%m-%d")
    
    log = await db.dailylog.find_first(
        where={"userId": user_id, "date": today},
        include={"meals": True}
    )
    
    if not log or not log.meals:
        return "No meals to delete today."
    
    found_meal = None
    for meal in log.meals:
        if meal_name.lower() in meal.name.lower():
            found_meal = meal
            break
    
    if not found_meal:
        return f"❌ Meal '{meal_name}' not found."
    
    await db.mealitem.delete(where={"id": found_meal.id})
    return f"🗑️ Deleted meal: {found_meal.name}"


# ============================================
# CONTENT TOOLS
# ============================================

@tool
async def get_content(config: RunnableConfig) -> str:
    """Get saved content list (Watchlist, Reading list). Use when user asks what to watch or read."""
    user_id = get_user_id(config)
    
    items = await db.contentitem.find_many(
        where={"userId": user_id},
        order={"createdAt": "desc"}
    )
    
    if not items:
        return "No content items saved yet."
    
    result = []
    for item in items:
        icon = "📺" if item.type == "WATCH" else "📚" if item.type == "READ" else "🔗"
        result.append(f"{icon} {item.title} ({item.platform or 'Unknown'}) - {item.type}")
    
    return "\n".join(result)

@tool(args_schema=AddContentArgs)
async def add_content(type: str, title: str, subtitle: Optional[str] = None, platform: Optional[str] = None, url: Optional[str] = None, *, config: RunnableConfig) -> str:
    """Save a movie, video, book, or article to watch/read later."""
    user_id = get_user_id(config)
    
    await db.contentitem.create(
        data={
            "userId": user_id,
            "type": type,
            "title": title,
            "subtitle": subtitle,
            "platform": platform,
            "url": url,
            "image": "https://placehold.co/100" # Default placeholder
        }
    )
    return f"✅ Added to {type} list: {title}"

@tool(args_schema=TransferToSearchArgs)
def transfer_to_search(query: str) -> str:
    """Use this tool when you need to search the web for real-time information. This will transfer control to a specialized search agent."""
    return "SEARCH_ROUTING"


# ============================================
# TOOL LISTS
# ============================================

SERVER_TOOLS = [
    # Tasks
    get_tasks,
    create_section,
    create_task,
    update_task,
    complete_task,
    delete_task,
    reschedule_task,
    # Journal
    get_journal_today,
    save_journal,
    # Health
    get_health_dashboard,
    log_water,
    # Finance
    get_transactions,
    add_transaction,
    # Memory
    get_memories,
    save_memory,
    # Accounts
    get_accounts,
    create_account,
    update_account,
    # Dev
    get_dev_profile,
    # Period
    log_period,
    get_period_info,
    # Nutrition
    log_meal,
    get_nutrition_today,
    delete_meal,
    # Content
    get_content,
    add_content,
    transfer_to_search,
]

SERVER_TOOL_NAMES = [t.name for t in SERVER_TOOLS]

# All tools combined
ALL_TOOLS = CLIENT_TOOLS + SERVER_TOOLS
