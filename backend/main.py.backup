from fastapi import FastAPI, File, UploadFile, HTTPException, Response
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from transcription import transcribe_audio
from entity_extraction import extract_medical_entities
from transcription import transcribe_audio_realtime
from soap_generator import generate_soap_note, format_soap_note_text

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
# Audio transcription endpoint
@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    print("\n" + "=" * 50)
    print(f"Received file: {file.filename}")
    print(f"Content type: {file.content_type}")
    print("=" * 50)
    
    # Validate file extension
    allowed_extensions = ['.mp3', '.wav', '.m4a', '.webm', '.ogg', '.flac']
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file_ext} not supported. Allowed: {allowed_extensions}"
        )
    
    # Save uploaded file temporarily
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        print(f"File saved to: {file_path}")
        
        # Transcribe audio
        transcription_result = transcribe_audio_realtime(file_path)

        # # === NEW CODE: Apply spell correction ===
        # from spell_correction import correct_medical_spelling

        # corrected_text, corrections_log = correct_medical_spelling(
        #     transcription_result, 
        #     threshold=85, 
        #     verbose=True
        # )

        # # Use corrected text for entity extraction
        # transcription_result = corrected_text
        # === END NEW CODE ===
        
        print(f"Transcription result: {transcription_result[:100]}...")
        
        # Extract medical entities from transcription
        entities_result = extract_medical_entities(transcription_result)
        
                # Updated: use total_entities instead of entity_count
        print(f"Entity extraction: Found {entities_result['total_entities']} entities")
        print(f"Categorized: {entities_result['category_counts']}")
        
        # Generate SOAP note from categorized entities
        soap_note = generate_soap_note(
            transcription_result,
            entities_result['categorized']
        )
        
        # Format SOAP note as text for easy reading
        soap_text = format_soap_note_text(soap_note)
        print("\n" + soap_text)
        
        # Clean up: delete the uploaded file
        os.remove(file_path)
        print(f"Cleaned up file: {file_path}")
        
        # Return combined results with new structure
        return {
            "success": True,
            "filename": file.filename,
            "transcription": transcription_result,
            "entities": {
                "total": entities_result["total_entities"],
                "breakdown": entities_result["category_counts"],
                "categorized": entities_result["categorized"],
                "all_entities": entities_result["entities"]
            },
            "soap_note": soap_note,
            "soap_note_text": soap_text
        }
        
    except Exception as e:
        # Clean up file even if there's an error
        if os.path.exists(file_path):
            os.remove(file_path)
        
        print("\n" + "=" * 50)
        print(f"ERROR in transcribe endpoint: {str(e)}")
        print("=" * 50 + "\n")
        
        raise HTTPException(status_code=500, detail=str(e))

class DownloadRequest(BaseModel):
    content: str
    filename: str = "soap_note.txt"

# Download SOAP note endpoint
@app.post("/api/download")
async def download_soap_note(request: DownloadRequest):
    """
    Endpoint to download the SOAP note as a text file.
    It takes the content and returns it as a downloadable file.
    """
    try:
        return Response(
            content=request.content,
            media_type="text/plain",
            headers={
                "Content-Disposition": f"attachment; filename={request.filename}"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
