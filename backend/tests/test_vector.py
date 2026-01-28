import asyncio
import time
from app.services.memory_store import memory_store

# ---------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------
TEST_USER_ID = "stress_test_user_999"

# A dataset designed to confuse simple keyword search algorithms
COMPLEX_DATA = [
    # Topic A: Programming Preferences (The "Java" Trap)
    {"text": "I absolutely love writing in JavaScript for frontend.", "meta": {"category": "tech"}},
    {"text": "I deeply loathe Java because of its verbosity.", "meta": {"category": "tech"}},
    {"text": "I drink coffee made from java beans every morning.", "meta": {"category": "lifestyle"}},

    # Topic B: The "Apple" Ambiguity
    {"text": "I need to buy a new MacBook Pro from Apple.", "meta": {"category": "tech"}},
    {"text": "I ate a red apple for lunch.", "meta": {"category": "food"}},
    
    # Topic C: Physics (Synonyms check)
    {"text": "The projectile maintained a high velocity.", "meta": {"category": "science"}},
]

async def run_stress_test():
    print(f"\n🔥 STARTING EMBEDDING STRESS TEST")
    print("===========================================")

    # 1. SEED DATA
    print(f"\n[Step 1] Seeding {len(COMPLEX_DATA)} tricky memories...")
    ids = []
    for item in COMPLEX_DATA:
        mid = memory_store.add(item["text"], TEST_USER_ID, item["meta"])
        if mid: ids.append(mid)
    
    # Allow indexing time
    time.sleep(1)
    print(f"✅ Seeded {len(ids)} items.")

    # 2. RUN TRICKY QUERIES
    # We will look at the TOP result and its Distance Score.
    # Lower Distance = Better Match.
    
    scenarios = [
        {
            "name": "The Synonym Test",
            "query": "Was the bullet fast?", 
            "expected_text": "projectile maintained a high velocity",
            "why": "Should link 'bullet'->'projectile' and 'fast'->'velocity'"
        },
        {
            "name": "The 'Hate' Test (Sentiment)",
            "query": "What programming language do I hate?",
            "expected_text": "loathe Java",
            "why": "Should match 'loathe' to 'hate' and ignore the positive JavaScript memory."
        },
        {
            "name": "The Context Trap (Tech vs Food)",
            "query": "What computer company do I like?",
            "expected_text": "MacBook Pro from Apple",
            "why": "Should ignore the fruit 'apple'."
        },
        {
            "name": "The Keyword Trap",
            "query": "Do I like Java?",
            "expected_text": "loathe Java",
            "why": "It SHOULD return the Java memory, but the Agent (later) will have to read 'loathe' to answer 'No'."
        }
    ]

    print("\n[Step 2] Running Scenarios...")
    
    for scen in scenarios:
        print(f"\n🔎 TEST: {scen['name']}")
        print(f"   Query: \"{scen['query']}\"")
        
        results = memory_store.search(scen['query'], TEST_USER_ID, limit=1)
        
        if not results:
            print("   ❌ FAILED: No results found.")
            continue

        top_match = results[0]
        text = top_match['text']
        score = top_match['score']
        
        # Check if expectation is met
        pass_fail = "✅ PASS" if scen['expected_text'] in text else "❌ FAIL"
        
        print(f"   Result: \"{text}\"")
        print(f"   Distance: {score:.4f} (Lower is better)")
        print(f"   Status: {pass_fail}")
        
        if pass_fail == "❌ FAIL":
            print(f"   ⚠️ Expected: \"{scen['expected_text']}\"")

    # 3. CLEANUP
    print(f"\n[Step 3] Cleaning up {len(ids)} memories...")
    for mid in ids:
        memory_store.delete(mid, TEST_USER_ID)
    print("✅ Cleanup complete.")

if __name__ == "__main__":
    asyncio.run(run_stress_test())