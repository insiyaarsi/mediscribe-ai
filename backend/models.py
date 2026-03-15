# models.py
# SQLAlchemy ORM models. Each class maps to one database table.
#
# Why store entities and soap_notes in separate tables rather than as JSON
# columns on transcriptions?
# Separate tables allow querying — e.g. "show all transcriptions where
# ibuprofen was mentioned" or "fetch only the SOAP note without loading
# the full entity list". JSON columns make queries like these impossible
# without scanning every row. For a portfolio project this also demonstrates
# proper relational design.

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    email         = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name    = Column(String, nullable=False)
    last_name     = Column(String, nullable=False)
    specialty     = Column(String, nullable=True)
    hospital      = Column(String, nullable=True)
    license_no    = Column(String, nullable=True)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    # One user has many transcriptions
    transcriptions = relationship("Transcription", back_populates="user", cascade="all, delete-orphan")


class Transcription(Base):
    __tablename__ = "transcriptions"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_id       = Column(String, nullable=False)       # PT-##### generated ID
    filename         = Column(String, nullable=False)
    transcription    = Column(Text, nullable=False)
    confidence_score = Column(Float, nullable=False, default=0.0)  # stored as 0-100
    duration         = Column(String, nullable=True)
    status           = Column(String, default="complete")
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user        = relationship("User", back_populates="transcriptions")
    entities    = relationship("MedicalEntity", back_populates="transcription", cascade="all, delete-orphan")
    soap_note   = relationship("SoapNote", back_populates="transcription", uselist=False, cascade="all, delete-orphan")


class MedicalEntity(Base):
    __tablename__ = "medical_entities"

    id               = Column(Integer, primary_key=True, index=True)
    transcription_id = Column(Integer, ForeignKey("transcriptions.id"), nullable=False)
    text             = Column(String, nullable=False)
    label            = Column(String, nullable=False)   # CHEMICAL, DISEASE, SYMPTOM, TEST, PROCEDURE
    confidence       = Column(Float, default=0.0)
    start            = Column(Integer, default=0)
    end              = Column(Integer, default=0)

    transcription = relationship("Transcription", back_populates="entities")


class SoapNote(Base):
    __tablename__ = "soap_notes"

    id               = Column(Integer, primary_key=True, index=True)
    transcription_id = Column(Integer, ForeignKey("transcriptions.id"), nullable=False, unique=True)
    subjective       = Column(Text, nullable=True)
    objective        = Column(Text, nullable=True)
    assessment       = Column(Text, nullable=True)
    plan             = Column(Text, nullable=True)
    source           = Column(String, nullable=True)   # "groq-llama-3.3-70b-versatile" or "rule-based-fallback"
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    transcription = relationship("Transcription", back_populates="soap_note")