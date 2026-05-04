# Architecture

## System Overview

MediScribe AI is a two-tier application with a React frontend and a FastAPI backend backed by PostgreSQL. The backend handles auth, transcription processing, persistence, and history retrieval. The frontend handles auth state, uploads, result display, and account-facing pages.

## Backend Architecture

### Entry Point

- `backend/main.py` defines the FastAPI app, CORS, auth endpoints, history endpoints, transcription endpoint, and download endpoint.

### Data Layer

- `backend/database.py` creates the SQLAlchemy engine and session factory from `DATABASE_URL`.
- `backend/models.py` defines:
- `User`
- `Transcription`
- `MedicalEntity`
- `SoapNote`

These are modeled relationally rather than as JSON blobs so the project can demonstrate proper queryable persistence.

### Auth Layer

- `backend/auth.py` provides password hashing, password verification, JWT creation, and current-user resolution from bearer tokens.
- Protected endpoints depend on `get_current_user`.

### Transcription / NLP Pipeline

The `/api/transcribe` endpoint performs the core workflow:

1. Accept uploaded audio
2. Validate extension
3. Persist file temporarily under `uploads/`
4. Reject clips shorter than 45 seconds when header data is present
5. Transcribe audio
6. Normalize transcript text
7. Validate medical relevance
8. Extract medical entities
9. Build structured clinical representation
10. Generate SOAP note
11. Persist transcription, entities, and SOAP note
12. Return full response payload

### Supporting Backend Modules

- `backend/transcription.py`: ASR backend integration
- `backend/spell_correction.py`: normalization / correction pass
- `backend/content_validator.py`: clinical-content validation
- `backend/entity_extraction.py`: extraction and categorization
- `backend/clinical_extraction.py`: structured representation for better notes
- `backend/soap_generator.py`: SOAP note generation and formatting
- `backend/schemas.py`: Pydantic request/response models
- `backend/lib/utils.py`: small shared helpers

## Frontend Architecture

### App Structure

- `frontend/src/App.tsx` coordinates high-level app flow and session restore
- `frontend/src/pages/` contains main app pages
- `frontend/src/components/` contains feature and layout components

### Data / State

- `frontend/src/services/api.ts` owns:
- Axios instance
- API calls
- token storage helpers
- request/response interceptors
- history mapping helpers

- `frontend/src/store/appStore.ts` owns:
- app navigation state
- sidebar state
- auth state
- upload/result state
- cached history state
- settings/preferences state

### Styling / UI

- React 19 + TypeScript
- Tailwind CSS v4
- shadcn/ui component conventions
- utility helpers via `clsx`, `tailwind-merge`, and `class-variance-authority`

## Runtime / Environments

### Local Fast Iteration

- Postgres runs in Docker
- Backend runs locally through `./scripts/dev-backend.sh`
- Frontend runs locally through `./scripts/dev-frontend.sh`

### Containerized Verification

- `Dockerfile` builds backend image
- `Dockerfile.frontend` builds frontend assets and serves them via Nginx
- `docker-compose.yml` wires backend, frontend, and Postgres together
- `nginx.conf` proxies `/api/` traffic to the backend

## Current Architectural Caveat

- Alembic exists, but schema management still relies partly on `create_all()` fallback. That means the data model is mature, but the migration workflow is not yet equally mature.
