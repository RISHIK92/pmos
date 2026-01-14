from google import genai
import os

client = genai.Client(api_key="AIzaSyDP1GwA7UcBkmTInfDlptKaxfpot7dlxxQ")

def transcribe_and_translate(audio_file_path = "/Users/rishikchowdarykaruturi/pmos/backend/services/recording-77eaadfb-ff8d-4e07-9e17-5766ff378b44.m4a"):
    with open(audio_file_path, "rb") as f:
            audio_bytes = f.read()

    result = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            genai.types.Part.from_bytes(
                data=audio_bytes, 
                mime_type="audio/m4a"
            ),
            "Listen to this audio. It may be in Hindi, Telugu, or English. "
            "Transcribe it and translate it directly into English text. "
            "Return ONLY the English text, no extra explanation."
            "IF FOUND HUMAN REACTIONS LIKE LAUGHTER, CRY OR ANGRY pass it with json in emotions: {}"
        ]
    )

    return result.text

# 👇 ADD THIS AT THE BOTTOM 👇
if __name__ == "__main__":
    # Replace this path with a REAL file on your computer to test
    test_audio_path = "/Users/rishikchowdarykaruturi/pmos/backend/services/recording-77eaadfb-ff8d-4e07-9e17-5766ff378b44.m4a"
    
    print("🚀 Starting transcription...")
    
    # Call the function
    result = transcribe_and_translate(test_audio_path)
    
    print("\n✅ RESULT:")
    print(result)