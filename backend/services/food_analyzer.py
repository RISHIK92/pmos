import os
from typing import Optional
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from langchain_core.output_parsers import JsonOutputParser

class FoodAnalysis(BaseModel):
    name: str = Field(description="Concise name of the food item(s), e.g., 'Avocado Toast with Egg'")
    kcal: int = Field(description="Estimated total calories")

async def analyze_food_image(base64_image: str) -> Optional[dict]:
    try:
        # Initialize Groq Vision Model
        # Using llama-3.2-11b-vision-preview as it is the standard vision model on Groq
        llm = ChatGroq(
            model="meta-llama/llama-4-scout-17b-16e-instruct", 
            api_key=os.getenv("GROQ_API_KEY"),
            temperature=0.1
        )
        
        parser = JsonOutputParser(pydantic_object=FoodAnalysis)
    
        
        msg = HumanMessage(
            content=[
                {"type": "text", "text": "Analyze this food image. Identify the meal and estimate the calories. Return ONLY valid JSON."},
                {
                    "type": "image_url", 
                    "image_url": {
                        "url": base64_image # Expecting full data URI from frontend
                    }
                },
                {"type": "text", "text": "\n" + parser.get_format_instructions()} 
            ]
        )
        
        # Invoke
        response = await llm.ainvoke([msg])
        
        # Parse
        parsed = parser.parse(response.content)
        return parsed

    except Exception as e:
        print(f"Food Analysis Error: {e}")
        return None
