import asyncio
import time
from langchain_core.messages import HumanMessage
from app.agents.master_agent import app
from app.services.memory_store import memory_store
from core.lifespan import db

# ---------------------------------------------------------
# 1. SETUP: COMPLEX DATASET
# ---------------------------------------------------------
TEST_USER_ID = "robust_test_user_X99"

SEEDED_MEMORIES = [
    # Domain: Tech Stack (Positive)
    {"text": "For backend development, I strictly prefer Python with FastAPI.", "meta": {"category": "tech"}},
    {"text": "My go-to frontend framework is Next.js with Tailwind CSS.", "meta": {"category": "tech"}},
    
    # Domain: Tech Stack (Negative / Sentiment)
    {"text": "I absolutely loathe using Java because of the boilerplate code.", "meta": {"category": "tech"}},
    
    # Domain: Health (Critical)
    {"text": "I have a severe allergy to peanuts. Even a trace is dangerous.", "meta": {"category": "health"}},
    
    # Domain: Security (Exact Match)
    {"text": "The passcode for my gym locker is 44-99-22.", "meta": {"category": "security"}},
    
    # Domain: Personal Projects
    {"text": "I am working on a secret project called 'Project AGI' which builds autonomous agents.", "meta": {"category": "projects"}},
]

# ---------------------------------------------------------
# 2. TEST CASES
# ---------------------------------------------------------
TEST_CASES = [
    {
        "name": "Direct Retrieval (Security)",
        "query": "What is my gym locker code?",
        "expected_keywords": ["44-99-22"],
        "forbidden_keywords": []
    },
    {
        "name": "Sentiment Analysis (Negative)",
        "query": "Should I use Java for my next backend project?",
        "expected_keywords": ["loathe", "hate", "no", "avoid"], # Expecting a negative recommendation
        "forbidden_keywords": ["love", "great", "recommend Java"]
    },
    {
        "name": "Synthesis (Tech Stack)",
        "query": "I want to build a full-stack app. What technologies would I likely use?",
        "expected_keywords": ["FastAPI", "Python", "Next.js"], 
        "forbidden_keywords": ["Java", "Django"] # Should pick the specific preferences
    },
    {
        "name": "Health Safety Check",
        "query": "Can I eat a Snickers bar? It has peanuts.",
        "expected_keywords": ["allergy", "allergic", "no", "dangerous", "not eat"],
        "forbidden_keywords": ["yes", "delicious", "go ahead"]
    },
    {
        "name": "Project Recall",
        "query": "Tell me about my secret AI project.",
        "expected_keywords": ["Project AGI", "autonomous agents"],
        "forbidden_keywords": []
    }
]

async def run_robust_test():
    print("🔌 Connecting to Database...")
    if not db.is_connected():
        await db.connect()
    print("✅ Database Connected.")

    print("\n🔥 STARTING ROBUST AGENT STRESS TEST")
    print(f"👤 User: {TEST_USER_ID}")
    print("==================================================")

    seeded_ids = []

    try:
        # -----------------------------------------------------
        # PHASE 1: SEEDING
        # -----------------------------------------------------
        print(f"\n[Phase 1] Seeding {len(SEEDED_MEMORIES)} diverse memories...")
        
        for mem in SEEDED_MEMORIES:
            mid = await memory_store.add(mem["text"], TEST_USER_ID, mem["meta"])
            if mid: seeded_ids.append(mid)
        
        print(f"✅ Seeded {len(seeded_ids)} memories. Indexing...")
        await asyncio.sleep(2) # Give Chroma/Voyage a moment

        # -----------------------------------------------------
        # PHASE 2: EXECUTION LOOP
        # -----------------------------------------------------
        print("\n[Phase 2] Running Test Cases...")
        
        passed_count = 0
        
        for i, test in enumerate(TEST_CASES):
            print(f"\n📝 Test {i+1}: {test['name']}")
            print(f"   Query: \"{test['query']}\"")
            
            # Run Agent
            config = {"configurable": {"user_id": TEST_USER_ID}}
            result = await app.ainvoke(
                {"messages": [HumanMessage(content=test['query'])]}, 
                config=config
            )
            
            response = result['messages'][-1].content
            print(f"   🤖 Agent: \"{response}\"")
            
            # Verification Logic
            has_expected = any(k.lower() in response.lower() for k in test['expected_keywords'])
            has_forbidden = any(k.lower() in response.lower() for k in test['forbidden_keywords'])
            
            if has_expected and not has_forbidden:
                print("   ✅ PASS")
                passed_count += 1
            else:
                print("   ❌ FAIL")
                print(f"      Missing: {test['expected_keywords']}")
                if has_forbidden:
                    print(f"      Found Forbidden: {test['forbidden_keywords']}")

            # Rate limit cooldown
            await asyncio.sleep(1)

        # -----------------------------------------------------
        # RESULTS
        # -----------------------------------------------------
        print("\n==================================================")
        print(f"📊 FINAL SCORE: {passed_count}/{len(TEST_CASES)} Passed")
        
        if passed_count == len(TEST_CASES):
            print("🏆 EXCELLENT! System is robust.")
        else:
            print("⚠️  Needs improvement.")

    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {e}")

    finally:
        # -----------------------------------------------------
        # PHASE 3: CLEANUP
        # -----------------------------------------------------
        print(f"\n[Phase 3] Cleaning up {len(seeded_ids)} memories...")
        for mid in seeded_ids:
            await memory_store.delete(mid, TEST_USER_ID)
        
        if db.is_connected():
            await db.disconnect()
        print("✅ Cleanup complete.")

if __name__ == "__main__":
    asyncio.run(run_robust_test())