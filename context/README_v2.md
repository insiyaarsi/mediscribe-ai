# MediScribe AI

## Snapshot

MediScribe AI is a full-stack medical transcription and documentation project. It accepts doctor-patient audio, transcribes it, validates that the content is clinical, extracts medical entities, builds a structured clinical representation, and generates a SOAP note. The system also supports authentication, transcription history, and PostgreSQL persistence.

This document is a current project overview created from code inspection and `project_memory.md` as of 2026-04-25. The original `README.md` has been left untouched.

## What We Are Trying To Achieve

- Build a strong portfolio project for university and job applications
- Show real production engineering, not just a model demo
- Ship a usable end-to-end healthcare-adjacent AI product
- Keep the stack affordable and as close to free as practical
- Reach a deployable state with auth, database, containerization, and clear documentation

## Current Product Scope

The current backend and frontend together support:

- User registration, login, session restore, and account deletion
- Authenticated audio upload and transcription
- Audio duration guardrails for clips under 45 seconds
- Medical content validation before downstream processing
- Medical entity extraction and categorization
- Clinical representation extraction for SOAP generation
- SOAP note generation and plain-text formatting
- Persistent transcription history with detail view and deletion
- Local hybrid development with Docker Postgres plus local FastAPI/Vite

## Architecture At A Glance

### Backend

- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT auth with `python-jose`
- Password hashing with `passlib[bcrypt]`
- `faster-whisper` for ASR
- `scispacy` plus biomedical model for entity extraction
- Groq-backed SOAP generation with fallback behavior in code

### Frontend

- React 19
- TypeScript
- Vite 7
- Zustand
- Axios
- Tailwind CSS v4
- shadcn/ui primitives

### Main Flow

1. Authenticated user uploads supported audio
2. Backend saves file temporarily
3. Audio is transcribed
4. Transcript is normalized with spelling correction
5. Transcript is validated as clinical
6. Medical entities are extracted
7. Clinical representation is assembled
8. SOAP note is generated
9. Result is saved to PostgreSQL
10. Frontend renders results and history

## Repo Structure

```text
mediscribe-ai/
├── backend/
├── frontend/
├── scripts/
├── docs/
├── project_memory.md
├── README.md
└── README_v2.md
```

## Important Documents

- `HANDOVER.md`: quickest path for a new Codex chat to become useful
- `PLAN.md`: active plan and near-term priorities
- `PROGRESS_TRACKER.md`: status checklist by area
- `PROGRESS.md`: narrative progress log
- `DECISIONS.md`: important decisions already locked in
- `FEATURES.md`: shipped, in-progress, and planned features
- `FIX_LOG.md`: fixes already made and bugs to keep in mind
- `ARCHITECTURE.md`: deeper technical structure
- `SETUP.md`: setup and run instructions

## Current Gaps

- Alembic is initialized but migrations are not yet part of the real workflow
- Deployment is planned but not yet fully completed
- Some documentation in the repo predates the current architecture
- Full test automation and CI maturity still need work

## Recommended Next Moves

- Write first real Alembic migration set
- Verify the full local flow against a clean environment
- Tighten deployment documentation for Railway and Vercel
- Add more explicit testing and smoke-check steps

## Related Existing Docs

- `project_memory.md`
- `docs/local-dev.md`
- `docs/test_results.md`
