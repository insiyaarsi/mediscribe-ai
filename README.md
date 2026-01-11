# MediScribe AI

A medical transcription system that converts doctor-patient conversations into structured clinical documentation using local AI models. This project demonstrates production-level ML engineering with a focus on healthcare applications.

[![Status](https://img.shields.io/badge/Status-Active%20Development-success)](https://github.com/insiyaarsi/mediscribe-ai)
[![Week](https://img.shields.io/badge/Week-6%20Complete-blue)](https://github.com/insiyaarsi/mediscribe-ai)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## Overview

MediScribe AI processes medical audio recordings through a complete pipeline: speech-to-text transcription, medical entity extraction, content validation, and SOAP note generation. The system runs entirely locally using Whisper for transcription and scispacy for medical NLP, eliminating API costs and latency.

**Current Status:** Week 6 complete - Frontend interface with content validation

## Key Features

**Core Processing**
- Speech-to-text transcription using OpenAI's Whisper model (local deployment)
- Medical entity extraction with scispacy's biomedical model
- Intelligent compound term merging (e.g., "shortness of breath", "congestive heart failure")
- Classification into 8 medical categories using 700+ term dictionary
- Automated SOAP note generation from extracted entities

**Content Validation**
- Medical content detection to prevent false documentation
- Dual validation criteria: 10% medical term density + 2 clinical markers
- Weighted confidence scoring system
- Clear user feedback for rejected content

**User Interface**
- React-based frontend with real-time processing
- Color-coded entity visualization by category
- Downloadable SOAP notes with timestamps
- Responsive design with Tailwind CSS

## Performance Metrics

Based on testing across 5 medical scenarios (226 total entities):

- Validation accuracy: 100% (5/5 medical scenarios passed, 1/1 non-medical rejected)
- Entity categorization rate: 70%
- Compound term merging accuracy: 100% (zero false positives)
- Average processing time: 5-10 seconds per audio file
- Medical term density range: 33-47% across valid scenarios

See [test results documentation](docs/test_results.md) for detailed analysis.

## Technical Architecture

**Backend Stack**
- FastAPI (Python) - REST API server
- Whisper base model - Speech recognition (140MB, runs on CPU)
- scispacy v0.6.2 with en_core_sci_sm - Biomedical NLP
- Custom medical dictionaries - 700+ terms across 8 categories

**Frontend Stack**
- React 18 with TypeScript
- Vite for development and building
- Tailwind CSS for styling
- Lucide React for icons

**Processing Pipeline**
```
Audio Upload → Whisper Transcription → Content Validation → 
Entity Extraction (scispacy) → Dictionary-based Categorization → 
SOAP Note Generation → React UI Display
```

## Installation

### Prerequisites
- Python 3.12 or higher
- Node.js 18 or higher
- Git

### Backend Setup

Clone the repository and install Python dependencies:

```bash
git clone https://github.com/insiyaarsi/mediscribe-ai.git
cd mediscribe-ai/backend
pip install -r requirements.txt
```

Download the required ML models:

```bash
python -m spacy download en_core_sci_sm
```

Start the backend server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000` with documentation at `http://localhost:8000/docs`

### Frontend Setup

Install Node dependencies and start the development server:

```bash
cd ../frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

The system accepts audio files in MP3, WAV, M4A, WebM, OGG, or FLAC format. Upload a medical audio recording through the web interface to:

1. Transcribe the audio using Whisper
2. Validate that the content is medical (automatic rejection of non-medical audio)
3. Extract and categorize medical entities
4. Generate a structured SOAP note
5. Download the results as a text file

Non-medical content will be rejected with a validation warning, showing the transcription but skipping entity extraction and SOAP generation.

## Project Structure

```
mediscribe-ai/
├── backend/
│   ├── main.py                    # FastAPI server and endpoints
│   ├── transcription.py           # Whisper integration
│   ├── entity_extraction.py       # scispacy NLP pipeline
│   ├── medical_categories.py      # Medical term dictionaries
│   ├── content_validator.py       # Validation system
│   ├── soap_generator.py          # SOAP note generation
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Main application component
│   │   └── components/           # Reusable UI components
│   ├── package.json
│   └── vite.config.ts
└── docs/
    ├── screenshots/              # Portfolio screenshots
    └── test_results.md          # Detailed testing analysis
```

## Testing

The system has been tested across 5 medical specialties:

- Cardiology (chest pain presentation) - 35 entities
- Respiratory (COPD exacerbation) - 47 entities
- Endocrinology (diabetes follow-up) - 33 entities
- Mental health (depression/anxiety) - 46 entities
- Multi-system (geriatric patient) - 67 entities

Additionally, a non-medical control test (TV show review) was correctly rejected by the validation system.

To run validation tests independently:

```bash
cd backend
python content_validator.py
```

## Technical Details

### Medical Entity Extraction

The system uses scispacy to identify medical entities, then categorizes them using custom dictionaries:

- Symptoms (180+ terms)
- Medications (124+ terms)
- Conditions (170+ terms)
- Procedures (115+ terms)
- Anatomical terms (85+ terms)
- Clinical modifiers (60+ terms)
- Clinical terms (30+ terms)

Compound terms are dynamically merged when consecutive entities match multi-word dictionary entries, avoiding the need for hardcoded patterns.

### Content Validation

Validation uses two criteria, both of which must be met:

- Medical term density: At least 10% of words must be medical terms
- Clinical markers: At least 2 clinical context phrases must be present

Clinical markers include terms like "patient", "vital signs", "year old", "diagnosis", and medical abbreviations like "mg", "bpm", "mmhg".

The confidence score is calculated as a weighted average (70% density, 30% markers).

### SOAP Note Generation

SOAP notes are generated using a template-based system that maps extracted entities to appropriate sections:

- **Subjective**: Chief complaint, symptoms, patient narrative
- **Objective**: Findings, procedures, vital signs
- **Assessment**: Primary diagnosis, all conditions
- **Plan**: Treatment plan, medications, follow-up

## Development Timeline

This is a 20-week portfolio project for university applications:

- Weeks 1-2: Backend foundation (FastAPI, Whisper, scispacy)
- Weeks 3-5: Entity extraction, categorization, SOAP generation
- Week 6: Frontend development and content validation (current)
- Week 7: UI polish and enhancements
- Weeks 8-10: Database integration (PostgreSQL)
- Week 11: User authentication (JWT)
- Week 12: Docker containerization
- Weeks 13-14: Testing and QA
- Weeks 15-16: Production deployment
- Weeks 17-20: User testing, documentation, launch

Target completion: May 2026

## Future Enhancements

Planned features for upcoming weeks:

- PostgreSQL database for persistence
- User authentication with JWT
- Real-time WebSocket streaming for live transcription
- ICD-10 code mapping for diagnoses
- Medication dosage and frequency extraction
- Drug interaction warnings
- Temporal information extraction (symptom onset, duration)
- FHIR-compliant output format
- Docker deployment
- Production hosting on Railway and Vercel

## Design Decisions

### Why Local Models?

After initial attempts with OpenAI and Hugging Face APIs resulted in rate limiting and reliability issues, I switched to local model deployment. This provides:

- Zero API costs
- Consistent performance without rate limits
- No external dependencies or downtime
- Better privacy for medical data

### Why Template-based SOAP Notes?

While AI-generated prose (e.g., using GPT) would produce more natural-sounding notes, template-based generation:

- Provides deterministic, reproducible output
- Maintains clinical accuracy without hallucination risk
- Keeps the entire system free and local
- Is sufficient for a portfolio demonstration

The trade-off is acceptable for an educational project.

## Known Limitations

- 30% of entities are marked "unknown" (primarily numbers, dosages, and temporal phrases)
- Objective section uses placeholder text when vitals aren't mentioned
- No negation detection ("no chest pain" vs "chest pain" both extract as symptoms)
- SOAP notes are template-based rather than naturally generated prose
- Single-user system (multi-user support planned for Week 11)
- No persistence (database integration planned for Weeks 9-10)

## License

MIT License - See LICENSE file for details.

## Author

Built by insiyaarsi as a portfolio project.

Repository: https://github.com/insiyaarsi/mediscribe-ai

---

Last updated: January 2026