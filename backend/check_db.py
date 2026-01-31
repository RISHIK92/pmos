import chromadb

client = chromadb.HttpClient(host='localhost', port=8001)
collection = client.get_collection(name="memory")

# Delete specific bad IDs
# bad_ids = ['3f7e7b02-cb66-4f4f-a1ac-e170f1a1ec45'] 
# collection.delete(ids=bad_ids)

# OR Wipe EVERYTHING to start fresh (Recommended for dev)
all_ids = collection.get()['ids']
if all_ids:
    collection.delete(ids=all_ids)
    print(f"🧹 Wiped {len(all_ids)} memories. Database is clean.")
else:
    print("Database is already empty.")