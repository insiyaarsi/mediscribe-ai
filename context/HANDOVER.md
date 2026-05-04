# Handover

This document is written so a new Codex chat can read it cold and start contributing quickly.

## What This Project Is

MediScribe AI is a full-stack medical transcription app. The core user flow is:

1. User signs in
2. User uploads audio
3. Backend transcribes and normalizes transcript
4. Backend validates that the content is clinical
5. Backend extracts entities and structured clinical information
6. Backend generates a SOAP note
7. Result is stored in PostgreSQL
8. Frontend shows current result and saved history

## What Matters Most Right Now

- Keep existing docs untouched if they already exist unless the user explicitly asks to edit them
- Treat `project_memory.md` as a key context file
- Preserve the current backend/frontend architecture
- Do not break auth or history persistence while making changes
- Be careful around Alembic because it is initialized but not yet the source of truth

## Repo Landmarks

- `backend/main.py`: primary API surface and transcription pipeline orchestration
- `backend/transcription.py`: ASR integration
- `backend/entity_extraction.py`: entity extraction and categorization
- `backend/clinical_extraction.py`: structured clinical representation
- `backend/soap_generator.py`: SOAP generation logic
- `backend/models.py`: relational schema
- `backend/auth.py`: JWT auth and current-user dependency
- `backend/database.py`: engine and session wiring
- `frontend/src/services/api.ts`: API client, auth token handling, history mapping
- `frontend/src/store/appStore.ts`: UI state and persisted preferences
- `scripts/dev-db.sh`, `scripts/dev-backend.sh`, `scripts/dev-frontend.sh`: preferred local workflow

## Current State Summary

- Auth exists and appears wired end to end
- PostgreSQL persistence exists and is live in the backend
- History endpoints exist and are protected
- Local dev workflow is intentionally optimized for fast iteration
- The root `README.md` is old, so use `README_v2.md` and this doc for current context
- Alembic exists but migrations are not yet the normal workflow

## How To Be Useful Immediately

- Read `project_memory.md`, `PLAN.md`, and `PROGRESS_TRACKER.md`
- Inspect the relevant backend or frontend files before proposing changes
- Prefer finishing tasks end to end: code, verification, and doc updates
- Keep docs aligned with actual code rather than earlier project phases

## Known Risks / Footguns

- There are older documents in the repo that describe an earlier project phase
- `README.md` should not be touched unless explicitly requested
- The database currently still relies on startup `create_all()` fallback
- Deployment assumptions should be verified instead of assumed
- Network-heavy or model-heavy tasks may take longer than standard web CRUD work

## Suggested Next Priority Order

1. Finish migration strategy with Alembic
2. Tighten deployment runbook
3. Add stronger testing / smoke verification
4. Keep documentation synchronized with code changes

## Documents Added In This Pass

- `README_v2.md`
- `DECISIONS.md`
- `FEATURES.md`
- `FIX_LOG.md`
- `HANDOVER.md`
- `PLAN.md`
- `PROGRESS_TRACKER.md`
- `PROGRESS.md`
- `ARCHITECTURE.md`
- `SETUP.md`
