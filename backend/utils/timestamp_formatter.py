from datetime import datetime, timedelta, time
from zoneinfo import ZoneInfo

# Define IST Timezone once
IST = ZoneInfo("Asia/Kolkata")

def get_reminder_timestamp(due_date, due_time):
    if isinstance(due_date, str):
        due_date = datetime.strptime(due_date, "%Y-%m-%d").date()
        
    if isinstance(due_time, str):
        due_time = time.fromisoformat(due_time)

    deadline_naive = datetime.combine(due_date, due_time)
    
    deadline_ist = deadline_naive.replace(tzinfo=IST)
    reminder_time = deadline_ist - timedelta(hours=1)
    
    return reminder_time.timestamp()