# schemas.py
# Pydantic models used for request validation and response serialisation.
#
# Why separate schemas from ORM models?
# SQLAlchemy models describe the database structure. Pydantic schemas describe
# what comes in over HTTP and what goes out. Keeping them separate means you
# can return a subset of fields (e.g. never return hashed_password), validate
# incoming data before it touches the database, and evolve the API shape
# independently from the schema.

from pydantic import BaseModel, EmailStr
from typing import Optional, List, Literal
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email:      EmailStr
    password:   str
    first_name: str
    last_name:  str
    specialty:  Optional[str] = None


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user: "UserPublic"


class NoteStyleProfile(BaseModel):
    note_style_preset: Literal["balanced", "concise", "detailed"] = "balanced"
    preferred_focus: Literal["general", "symptom_driven", "assessment_driven", "plan_driven"] = "general"
    include_bullets_in_plan: bool = False
    include_patient_friendly_language: bool = False


class UserPublic(BaseModel):
    id:         int
    email:      str
    first_name: str
    last_name:  str
    specialty:  Optional[str]
    hospital:   Optional[str]
    license_no: Optional[str]
    note_style_preset: Literal["balanced", "concise", "detailed"] = "balanced"
    preferred_focus: Literal["general", "symptom_driven", "assessment_driven", "plan_driven"] = "general"
    include_bullets_in_plan: bool = False
    include_patient_friendly_language: bool = False

    class Config:
        from_attributes = True


# Required for forward reference in TokenResponse
TokenResponse.model_rebuild()


class UpdateProfileRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    specialty: Optional[str] = None
    hospital: Optional[str] = None
    license_no: Optional[str] = None
    note_style_preset: Optional[Literal["balanced", "concise", "detailed"]] = None
    preferred_focus: Optional[Literal["general", "symptom_driven", "assessment_driven", "plan_driven"]] = None
    include_bullets_in_plan: Optional[bool] = None
    include_patient_friendly_language: Optional[bool] = None


# ── History ───────────────────────────────────────────────────────────────────

class EntityOut(BaseModel):
    text:       str
    label:      str
    confidence: float
    start:      int
    end:        int

    class Config:
        from_attributes = True


class SoapNoteOut(BaseModel):
    subjective: Optional[str]
    objective:  Optional[str]
    assessment: Optional[str]
    plan:       Optional[str]
    source:     Optional[str]

    class Config:
        from_attributes = True


class HistoryEntryOut(BaseModel):
    id:               int
    patient_id:       str
    filename:         str
    transcription:    str
    confidence_score: float
    duration:         Optional[str]
    status:           str
    created_at:       datetime
    entities:         List[EntityOut]
    soap_note:        Optional[SoapNoteOut]

    class Config:
        from_attributes = True
