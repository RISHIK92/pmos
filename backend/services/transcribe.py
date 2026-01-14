import os
from groq import Groq

# It is best to load your key from an environment variable
# export GROQ_API_KEY='your_new_key_here'
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def voice_to_text(audio_file_path):
    with open(audio_file_path, "rb") as file:
        # 2. This is the correct Groq SDK syntax
        translation = client.audio.translations.create(
            file=(os.path.basename(audio_file_path), file.read()),
            model="whisper-large-v3", # High accuracy
            response_format="json"
        )
    print(translation.text, translation)
    return translation.text


# from google import genai
# import json

# client = genai.Client(api_key="")

# prompt = """
# Act as a high-accuracy speech-to-text and sentiment analysis engine.
# Your task is to transcribe the provided audio and translate it into English.

# OUTPUT FORMAT:
# Return a valid JSON object with the following keys:
# - "text": (string) The full English translation of the audio.
# - "emotion": (string) Identify human reactions (e.g., "laughter", "crying", "angry", "neutral").

# STRICT RULES:
# 1. If the audio is in Hindi or Telugu, translate it to English.
# 2. Return ONLY the JSON object. No markdown formatting (like ```json), no preamble, and no explanation.
# 3. If no specific emotion is detected, set "emotion" to "neutral".
# """

# def transcribe_and_translate(audio_file_path = "/Users/rishikchowdarykaruturi/pmos/backend/services/recording-77eaadfb-ff8d-4e07-9e17-5766ff378b44.m4a"):
#     with open(audio_file_path, "rb") as f:
#             audio_bytes = f.read()

#     result = client.models.generate_content(
#         model="gemini-2.5-flash",
#         contents=[
#             genai.types.Part.from_bytes(
#                 data=audio_bytes, 
#                 mime_type="audio/m4a"
#             ), prompt
#         ]
#     )

#     raw_text = result.text.strip()
    
#     # Remove markdown code blocks if the model includes them
#     if raw_text.startswith("```"):
#         raw_text = raw_text.strip("```").replace("json", "", 1).strip()

#     data = json.loads(raw_text)
#     # Now you can access data['text'] and data['emotion']
#     print(data)
#     return data['text']


# # 👇 ADD THIS AT THE BOTTOM 👇
# if __name__ == "__main__":
#     # Replace this path with a REAL file on your computer to test
#     test_audio_path = "/Users/rishikchowdarykaruturi/pmos/backend/services/recording-77eaadfb-ff8d-4e07-9e17-5766ff378b44.m4a"
    
#     print("🚀 Starting transcription...")
    
#     # Call the function
#     result = transcribe_and_translate(test_audio_path)
    
#     print("\n✅ RESULT:")
#     print(result)