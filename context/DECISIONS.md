# Decisions

This file records decisions that appear to be active and intentionally locked in based on the current codebase and project memory.

## Locked Decisions

### Product Direction

- The project is being built as a portfolio-quality, production-leaning medical transcription platform rather than a narrow model demo.
- The target outcome is a deployed, end-to-end system with backend, frontend, auth, database, and documentation.

### Backend

- FastAPI is the backend framework.
- PostgreSQL is the primary database.
- SQLAlchemy ORM is the persistence layer.
- JWT bearer auth is the authentication model.
- Passwords are hashed with bcrypt through `passlib`.

### AI / NLP Pipeline

- `faster-whisper` is the primary ASR backend.
- `openai-whisper` is no longer the intended installed backend.
- Transcript normalization is part of the live pipeline.
- Medical entity extraction uses `scispacy` plus a custom dictionary pass.
- SOAP notes are generated from both transcript text and structured clinical extraction.

### Frontend

- React + TypeScript + Vite is the frontend stack.
- Zustand is the client state layer.
- Axios interceptors handle bearer-token attachment and expired-session behavior.
- Tailwind CSS v4 is the active styling approach.

### Development Workflow

- Local hybrid development is the preferred fast iteration path:
- PostgreSQL in Docker
- Backend locally with reload
- Frontend locally with Vite
- Production-style Docker files remain in the repo for full-stack verification later.

### Persistence Model

- Users, transcriptions, medical entities, and SOAP notes are stored in separate relational tables.
- Transcription history is user-scoped and protected by auth.
- Relationship loading for history uses eager loading to avoid lazy-load serialization issues.

## Decisions That Need To Stay Visible

- `models.Base.metadata.create_all(bind=engine)` is still being used as a startup fallback.
- Alembic has been initialized, but migration authoring and migration-first workflow are still unfinished.
- Minimum audio duration is enforced at 45 seconds in both the backend flow and frontend UX.

## Decisions Still Open

- Exact deployment runbook for Railway and Vercel
- Migration strategy for first production schema rollout
- Formal testing strategy and CI expectations
- Future privacy / compliance framing for demo vs production positioning
