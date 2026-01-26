from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.tools import BaseTool
from typing import List, Dict

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
        Converts tool descriptions into vectors.
        Format: "tool_name: tool_description"
        """
        print(f"⚙️ Indexing {len(self.tools)} tools...")
        tool_texts = [f"{t.name}: {t.description}" for t in self.tools]
        
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        metadatas = [{"tool_name": t.name} for t in self.tools]
        
        self.vector_store = FAISS.from_texts(
            texts=tool_texts,
            embedding=embeddings,
            metadatas=metadatas
        )
        print("✅ Tool Indexing Complete.")

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