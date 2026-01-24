import os
from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def voice_to_text(audio_file_path):
    with open(audio_file_path, "rb") as file:
        translation = client.audio.translations.create(
            file=(os.path.basename(audio_file_path), file.read()),
            model="whisper-large-v3",
            response_format="json"
        )
    print(translation.text, translation)
    return translation.text