from langchain_community.vectorstores import FAISS
from langchain_voyageai import VoyageAIEmbeddings
from langchain_core.tools import BaseTool
from typing import List, Dict
import os

# Import your tool lists
from app.agents.tools import ALL_TOOLS

class ToolRetriever:
    def __init__(self, tools: List[BaseTool]):
        self.tools = tools
        self.tool_map: Dict[str, BaseTool] = {t.name: t for t in tools}
        self.vector_store = None
        self._build_index()

    def _build_index(self):
        """
        Converts tool descriptions into vectors using Voyage AI API.
        """
        print(f"⚙️ Indexing {len(self.tools)} tools with Voyage AI...")
        
        tool_texts = [f"{t.name}: {t.description}" for t in self.tools]
        metadatas = [{"tool_name": t.name} for t in self.tools]
        
        voyage_api_key = os.getenv("CHROMA_VOYAGE_API_KEY") or os.getenv("VOYAGE_API_KEY")
        embeddings = VoyageAIEmbeddings(
            voyage_api_key=voyage_api_key,
            model="voyage-3"
        )
        
        self.vector_store = FAISS.from_texts(
            texts=tool_texts,
            embedding=embeddings,
            metadatas=metadatas
        )
        print("✅ Tool Indexing Complete (Zero-Weight).")

    def query(self, user_query: str, k: int = 5) -> List[BaseTool]:
        """
        Returns the top K tools relevant to the user's query.
        """
        docs = self.vector_store.similarity_search(user_query, k=k)
        
        selected_tools = []
        for doc in docs:
            tool_name = doc.metadata["tool_name"]
            if tool_name in self.tool_map:
                selected_tools.append(self.tool_map[tool_name])
                
        return selected_tools

tool_retriever = ToolRetriever(ALL_TOOLS)