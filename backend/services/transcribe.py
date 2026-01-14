import google.generative_ai as genai
import os

genai.configure(api_key="YOUR_GEMINI_API_KEY")

def transcribe_and_translate(audio_file_path = "/Users/rishikchowdarykaruturi/pmos/backend/services/recording-77eaadfb-ff8d-4e07-9e17-5766ff378b44.m4a"):
    myfile = genai.upload_file(audio_file_path)

    model = genai.GenerativeModel("gemini-2.5-flash")

    result = model.generate_content(
        [
            myfile,
            "Listen to this audio. It may be in Hindi, Telugu, or English. "
            "Transcribe it and translate it directly into English text. "
            "Return ONLY the English text, no extra explanation."
        ]
    )
    
    return result.text