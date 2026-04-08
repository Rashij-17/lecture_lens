import whisper
import os

print("Loading Whisper base model...")
model = whisper.load_model("base")

def transcribe_video(filepath: str) -> list[dict]:
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found: {filepath}")

    result = model.transcribe(filepath)

    formatted_segments = []
    for segment in result["segments"]:
        formatted_segments.append({
            "id": segment["id"],
            "start": round(segment["start"], 2),
            "end": round(segment["end"], 2),
            "text": segment["text"].strip()
        })

    return formatted_segments