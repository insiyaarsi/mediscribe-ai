from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, File, UploadFile, HTTPException, Response
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from transcription import transcribe_audio_realtime
from entity_extraction import extract_medical_entities
from soap_generator import generate_soap_note, format_soap_note_text
from content_validator import validate_medical_content


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
    Transcribe uploaded audio file and extract medical entities.
    Now includes content validation to ensure medical relevance.
    """
    print("\n" + "=" * 60)
    print("NEW TRANSCRIPTION REQUEST")
    print("=" * 60)
    print(f"Received file: {file.filename}")
    print(f"Content type: {file.content_type}")
    
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
        
        # STEP 1: Transcribe audio
        print("\n--- STEP 1: TRANSCRIPTION ---")
        transcription_result = transcribe_audio_realtime(file_path)
        
        print(f"Transcription: {transcription_result[:200]}...")
        
        # STEP 2: VALIDATE MEDICAL CONTENT (NEW)
        print("\n--- STEP 2: CONTENT VALIDATION ---")
        validation_result = validate_medical_content(transcription_result)
        
        print(f"Validation Status: {validation_result['is_valid']}")
        print(f"Confidence Score: {validation_result['confidence_score']}")
        print(f"Reason: {validation_result['reason']}")
        print(f"Medical Term Density: {validation_result['details']['medical_term_density']}")
        print(f"Clinical Markers Found: {validation_result['details']['clinical_markers_found']}")
        
        # If validation fails, return early with transcription only
        if not validation_result['is_valid']:
            print("\n⚠️  VALIDATION FAILED - Skipping entity extraction and SOAP generation")
            print("=" * 60 + "\n")
            
            # Clean up temp file
            if os.path.exists(file_path):
                os.remove(file_path)
            
            return {
                "success": False,
                "filename": file.filename,
                "transcription": transcription_result,
                "validation": validation_result,
                "message": "Non-medical content detected. Please upload clinical audio only."
            }
        
        # STEP 3: Extract medical entities (only if validation passed)
        print("\n--- STEP 3: ENTITY EXTRACTION ---")
        entities_result = extract_medical_entities(transcription_result)
        
        print(f"Entity extraction: Found {entities_result['total_entities']} entities")
        print(f"Categorized: {entities_result['category_counts']}")
        
        # STEP 4: Generate SOAP note (only if validation passed)
        print("\n--- STEP 4: SOAP NOTE GENERATION ---")
        soap_note = generate_soap_note(
            transcription_result,
            entities_result['categorized']
        )
        
        # Format SOAP note as text
        soap_text = format_soap_note_text(soap_note)
        print("SOAP note generated successfully")
        print("=" * 60 + "\n")
        
        # Clean up temp file
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Cleaned up file: {file_path}")
        
        # Return complete results
        return {
            "success": True,
            "filename": file.filename,
            "transcription": transcription_result,
            "validation": validation_result,
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
        
        print("\n" + "=" * 60)
        print(f"ERROR in transcribe endpoint: {str(e)}")
        print("=" * 60 + "\n")
        
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