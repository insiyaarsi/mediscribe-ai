import os
import whisper
from pathlib import Path

# Load the model once (this will download it the first time, ~140MB)
# Using 'base' model - good balance of speed and accuracy
print("Loading Whisper model...")
model = whisper.load_model("base")
print("Whisper model loaded successfully!")

def transcribe_audio(audio_file_path: str) -> dict:
    """
    Transcribe audio file using LOCAL Whisper model.
    No API calls, no rate limits, works offline.
    
    Args:
        audio_file_path: Path to the audio file
        
    Returns:
        Dictionary containing transcription text and metadata
    """
    try:
        print(f"Transcribing: {audio_file_path}")
        
        # Transcribe using local Whisper model
        result = model.transcribe(audio_file_path)
        
        transcription_text = result["text"]
        detected_language = result.get("language", "en")
        
        print("=" * 50)
        print(f"SUCCESS! Transcribed: {transcription_text[:100]}...")
        print("=" * 50)
        
        return {
            "success": True,
            "text": transcription_text,
            "language": detected_language,
            "duration": None,
            "error": None
        }
    
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print("=" * 50)
        print("TRANSCRIPTION ERROR:")
        print(error_detail)
        print("=" * 50)
        
        return {
            "success": False,
            "text": None,
            "language": None,
            "duration": None,
            "error": str(e)
        }

def transcribe_audio_realtime(audio_file_path: str) -> str:
    """
    Simplified version that returns just the text.
    """
    result = transcribe_audio(audio_file_path)
    
    if result["success"]:
        return result["text"]
    else:
        raise Exception(f"Transcription failed: {result['error']}")

