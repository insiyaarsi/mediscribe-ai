from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from transcription import transcribe_audio

# Create the FastAPI application
app = FastAPI(
    title="MediScribe AI API",
    description="Real-time medical transcription and documentation system",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Root endpoint
@app.get("/")
def read_root():
    return {
        "message": "Welcome to MediScribe AI",
        "status": "Server is running",
        "version": "1.0.0"
    }

# Health check endpoint
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "MediScribe AI Backend"
    }

# Audio transcription endpoint
@app.post("/api/transcribe")
async def transcribe_audio_endpoint(file: UploadFile = File(...)):
    """
    Upload an audio file and get transcription.
    
    Accepts: MP3, WAV, M4A, WebM (most audio formats)
    Returns: Transcribed text and metadata
    """
    
    # Validate file type
    allowed_extensions = [".mp3", ".wav", ".m4a", ".webm", ".ogg", ".flac"]
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Save uploaded file temporarily
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Transcribe the audio
        result = transcribe_audio(file_path)
        
        # Clean up - delete the uploaded file
        os.remove(file_path)
        
        if result["success"]:
            return {
                "success": True,
                "filename": file.filename,
                "transcription": result["text"],
                "language": result["language"],
                "duration_seconds": result["duration"]
            }
        else:
            raise HTTPException(status_code=500, detail=result["error"])
    
    except Exception as e:
        # Clean up file if it exists
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Print the full error to console
        import traceback
        print("=" * 50)
        print("TRANSCRIPTION ERROR:")
        print(traceback.format_exc())
        print("=" * 50)
        
        raise HTTPException(status_code=500, detail=str(e))