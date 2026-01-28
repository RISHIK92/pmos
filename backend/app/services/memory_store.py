import os
import time
import uuid
import logging
import asyncio
from typing import Optional, List, Dict, Any

import chromadb
from chromadb.utils.embedding_functions import VoyageAIEmbeddingFunction

from core.lifespan import chroma_client

logger = logging.getLogger(__name__)

class MemoryStore:
    def __init__(self):
        self.client = chroma_client
        self.collection_name = "memory"
        
        voyage_api_key = os.getenv("CHROMA_VOYAGE_API_KEY") or os.getenv("VOYAGE_API_KEY")
        if not voyage_api_key:
            logger.warning("⚠️ VOYAGE_API_KEY not found. Embeddings will fail.")
            self.embedding_fn = None
        else:
            self.embedding_fn = VoyageAIEmbeddingFunction(
                api_key=voyage_api_key,
                model_name="voyage-3"
            )

        try:
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                embedding_function=self.embedding_fn
            )
            print(f"✅ Connected to ChromaDB collection: '{self.collection_name}'")
        except Exception as e:
            logger.error(f"❌ Failed to get collection '{self.collection_name}': {e}")
            self.collection = None

    async def add(self, text: str, user_id: str, metadata: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """
        Adds a text memory asynchronously.
        Uses asyncio.to_thread to prevent blocking the event loop.
        """
        if not self.collection:
            return None

        mem_id = str(uuid.uuid4())
        timestamp = int(time.time())
        
        final_metadata = {
            "user_id": user_id,
            "created_at": timestamp
        }
        if metadata:
            final_metadata.update(metadata)

        try:
            await asyncio.to_thread(
                self.collection.add,
                ids=[mem_id],
                documents=[text],
                metadatas=[final_metadata]
            )
            return mem_id
        except Exception as e:
            logger.error(f"Error adding memory: {e}")
            return None

    async def search(self, query: str, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Semantic search asynchronously.
        """
        if not self.collection:
            return []

        try:
            # Run the blocking sync call in a thread
            results = await asyncio.to_thread(
                self.collection.query,
                query_texts=[query],
                n_results=limit,
                where={"user_id": user_id}
            )

            formatted_results = []
            if results and results['ids']:
                ids = results['ids'][0]
                docs = results['documents'][0]
                metas = results['metadatas'][0]
                dists = results['distances'][0] if results['distances'] else [0.0]*len(ids)

                for i, mid in enumerate(ids):
                    formatted_results.append({
                        "id": mid,
                        "text": docs[i],
                        "metadata": metas[i],
                        "score": dists[i]
                    })
            
            return formatted_results
        except Exception as e:
            logger.error(f"Error searching memory: {e}")
            return []

    async def delete(self, memory_id: str, user_id: str) -> bool:
        """
        Deletes a memory asynchronously.
        """
        if not self.collection:
            return False

        try:
            await asyncio.to_thread(
                self.collection.delete,
                ids=[memory_id],
                where={"user_id": user_id}
            )
            return True
        except Exception as e:
            logger.error(f"Error deleting memory: {e}")
            return False

memory_store = MemoryStore()