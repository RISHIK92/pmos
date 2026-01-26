import sys
import os

# 1. Get the absolute path to the 'backend' folder
current_dir = os.path.dirname(os.path.abspath(__file__)) # .../backend/utils
backend_root = os.path.dirname(current_dir)              # .../backend

# 2. Add it to Python's path so it can find 'services'
sys.path.append(backend_root)

# 3. NOW you can import safely
from services.tool_registry import tool_retriever

queries = [
    "I drank a glass of water",
    "Call my mom",
    "I spent 500 rupees on food",
    "Create a task to buy milk"
]

for q in queries:
    tools = tool_retriever.query(q, k=4)
    names = [t.name for t in tools]
    print(f"Query: '{q}' -> Tools: {names}")