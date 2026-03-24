from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, File, UploadFile, HTTPException, Response, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session, selectinload
import os

from transcription import transcribe_audio_realtime
from entity_extraction import extract_medical_entities
from soap_generator import generate_soap_note, format_soap_note_text
from content_validator import validate_medical_content
from spell_correction import correct_medical_spelling
from database import get_db, engine
from auth import hash_password, verify_password, create_access_token, get_current_user
import models
import schemas
from lib.utils import generate_patient_id, estimate_duration

# Create all tables on startup if they do not exist.
# In production, Alembic handles migrations. This line is a safe fallback that
# ensures tables exist on first boot without requiring a manual migration step.
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MediScribe AI API",
    description="Real-time medical transcription and documentation system",
    version="2.0.0"
)

default_cors_origins = [
    "http://localhost",
    "http://127.0.0.1",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", ",".join(default_cors_origins)).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── Health / root ─────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"message": "Welcome to MediScribe AI", "status": "Server is running", "version": "2.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "MediScribe AI Backend"}


# ── Auth ──────────────────────────────────────────────────────────────────────

@app.post("/api/auth/register", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user. Returns a JWT token immediately so the frontend
    can log the user in without a separate login step after registration.
    """
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user = models.User(
        email           = payload.email,
        hashed_password = hash_password(payload.password),
        first_name      = payload.first_name,
        last_name       = payload.last_name,
        specialty       = payload.specialty,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return schemas.TokenResponse(access_token=token, user=schemas.UserPublic.model_validate(user))


@app.post("/api/auth/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate an existing user. Returns a JWT token on success.
    Returns 401 for both "email not found" and "wrong password" — deliberately
    vague to prevent email enumeration attacks.
    """
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    token = create_access_token(user.id)
    return schemas.TokenResponse(access_token=token, user=schemas.UserPublic.model_validate(user))


@app.get("/api/auth/me", response_model=schemas.UserPublic)
def get_me(current_user: models.User = Depends(get_current_user)):
    """
    Returns the profile of the currently authenticated user.
    Used by the frontend on app load to restore the user session from a stored token.
    """
    return current_user


# ── History ───────────────────────────────────────────────────────────────────

@app.get("/api/history", response_model=list[schemas.HistoryEntryOut])
def get_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns all transcriptions for the authenticated user, newest first.
    """
    return (
        db.query(models.Transcription)
        .options(
            selectinload(models.Transcription.entities),
            selectinload(models.Transcription.soap_note),
        )
        .filter(models.Transcription.user_id == current_user.id)
        .order_by(models.Transcription.created_at.desc())
        .all()
    )

@app.get("/api/history/{transcription_id}", response_model=schemas.HistoryEntryOut)
def get_transcription(
    transcription_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = (
        db.query(models.Transcription)
        .options(
            selectinload(models.Transcription.entities),
            selectinload(models.Transcription.soap_note),
        )
        .filter(models.Transcription.id == transcription_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Transcription not found")
    if record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorised")
    return record


@app.delete("/api/history/{transcription_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_history_item(
    transcription_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Deletes a transcription owned by the authenticated user.
    Returns 404 if not found, 403 if it belongs to a different user.
    """
    record = db.query(models.Transcription).filter(models.Transcription.id == transcription_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Transcription not found")
    if record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorised")
    db.delete(record)
    db.commit()


@app.delete("/api/history", status_code=status.HTTP_204_NO_CONTENT)
def delete_all_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Deletes all transcriptions owned by the authenticated user.
    """
    records = (
        db.query(models.Transcription)
        .filter(models.Transcription.user_id == current_user.id)
        .all()
    )
    for record in records:
        db.delete(record)
    db.commit()


@app.delete("/api/auth/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_account(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Permanently deletes the authenticated user's account and all related data.
    """
    db.delete(current_user)
    db.commit()


# ── Transcription ─────────────────────────────────────────────────────────────

@app.post("/api/transcribe")
async def transcribe_audio_endpoint(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Transcribe uploaded audio, extract entities, generate SOAP note, and
    persist the full result to the database linked to the authenticated user.
    """
    print("\n" + "=" * 60)
    print("NEW TRANSCRIPTION REQUEST")
    print("=" * 60)
    print(f"User: {current_user.email} (id={current_user.id})")
    print(f"File: {file.filename}")

    allowed_extensions = ['.mp3', '.wav', '.m4a', '.webm', '.ogg', '.flac']
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file_ext} not supported. Allowed: {allowed_extensions}"
        )

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Step 1: Transcribe
        print("\n--- STEP 1: TRANSCRIPTION ---")
        transcription_result = transcribe_audio_realtime(file_path)
        print(f"Transcription: {transcription_result[:200]}...")

        print("\n--- STEP 1B: TRANSCRIPT NORMALISATION ---")
        transcription_result, correction_log = correct_medical_spelling(
            transcription_result,
            verbose=True,
        )
        print(f"Transcript normalisation complete: {len(correction_log['phrase_replacements'])} phrase replacements, "
              f"{len(correction_log['word_corrections'])} word corrections")

        # Step 2: Validate
        print("\n--- STEP 2: CONTENT VALIDATION ---")
        validation_result = validate_medical_content(transcription_result)
        print(f"Validation: {validation_result['is_valid']} | Confidence: {validation_result['confidence_score']}")

        if not validation_result['is_valid']:
            print("VALIDATION FAILED — skipping entity extraction and SOAP generation")
            if os.path.exists(file_path):
                os.remove(file_path)
            return {
                "success": False,
                "filename": file.filename,
                "transcription": transcription_result,
                "validation": validation_result,
                "message": "Non-medical content detected. Please upload clinical audio only."
            }

        # Step 3: Extract entities
        print("\n--- STEP 3: ENTITY EXTRACTION ---")
        entities_result = extract_medical_entities(transcription_result)
        print(f"Found {entities_result['total_entities']} entities")

        # Step 4: Generate SOAP note
        print("\n--- STEP 4: SOAP NOTE GENERATION ---")
        soap_note = generate_soap_note(transcription_result, entities_result['categorized'])
        soap_text = format_soap_note_text(soap_note)
        print("SOAP note generated")

        # Step 5: Persist to database
        print("\n--- STEP 5: PERSISTING TO DATABASE ---")
        confidence_0_to_100 = float(validation_result['confidence_score']) * 100

        db_transcription = models.Transcription(
            user_id          = current_user.id,
            patient_id       = generate_patient_id(),
            filename         = file.filename,
            transcription    = transcription_result,
            confidence_score = confidence_0_to_100,
            duration         = estimate_duration(len(content)),
            status           = "complete",
        )
        db.add(db_transcription)
        db.flush()  # get db_transcription.id before committing

        for ent in entities_result['entities']:
            db.add(models.MedicalEntity(
                transcription_id = db_transcription.id,
                text             = ent.get('text', ''),
                label            = ent.get('label', ''),
                confidence       = float(ent.get('confidence', 0.0)),
                start            = int(ent.get('start', 0)),
                end              = int(ent.get('end', 0)),
            ))

        # soap_note sections may be strings (Groq) or dicts (fallback)
        def _to_str(val) -> str:
            if isinstance(val, str):
                return val
            if isinstance(val, dict):
                return "\n".join(f"{k}: {v}" for k, v in val.items())
            return str(val) if val is not None else ""

        db.add(models.SoapNote(
            transcription_id = db_transcription.id,
            subjective       = _to_str(soap_note.get('subjective')),
            objective        = _to_str(soap_note.get('objective')),
            assessment       = _to_str(soap_note.get('assessment')),
            plan             = _to_str(soap_note.get('plan')),
            source           = soap_note.get('source', ''),
        ))

        db.commit()
        db.refresh(db_transcription)
        print(f"Persisted transcription id={db_transcription.id}")
        print("=" * 60 + "\n")

        if os.path.exists(file_path):
            os.remove(file_path)

        return {
            "success": True,
            "filename": file.filename,
            "transcription": transcription_result,
            "validation": validation_result,
            "entities": {
                "total":       entities_result["total_entities"],
                "breakdown":   entities_result["category_counts"],
                "categorized": entities_result["categorized"],
                "all_entities": entities_result["entities"],
            },
            "soap_note":      soap_note,
            "soap_note_text": soap_text,
            "db_id":          db_transcription.id,
        }

    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        print(f"\nERROR in transcribe endpoint: {str(e)}\n")
        raise HTTPException(status_code=500, detail=str(e))


# ── Download ──────────────────────────────────────────────────────────────────

class DownloadRequest(BaseModel):
    content:  str
    filename: str = "soap_note.txt"


@app.post("/api/download")
async def download_soap_note(request: DownloadRequest):
    try:
        return Response(
            content=request.content,
            media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename={request.filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
