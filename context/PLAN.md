# Plan

This plan was locked on 2026-05-04 after reviewing all Markdown files in `context/` plus the current backend and frontend implementation.

## Direction

MediScribe AI should stay focused on a low-cost, portfolio-quality product for individual clinicians, trainees, and small practices. The current core app is already in place: auth, upload, transcription, medical validation, entity extraction, SOAP generation, history, settings, Docker, and local dev scripts. The next work should harden the foundation first, then add roadmap features in small, demoable phases.

Do not edit the old root `README.md` unless explicitly requested. Use `context/`, `project_memory.md`, and inspected code as the current source of truth.

## Phase 1 — Stabilize The Foundation

- Create the first Alembic migration baseline for `users`, `transcriptions`, `medical_entities`, and `soap_notes`, including note-style profile columns.
- Make migrations the documented source of truth while keeping startup table creation only as a temporary local fallback until verified.
- Verify clean local setup: database, backend, frontend, registration, login, upload, result display, history detail, delete one, delete all, account delete.
- Confirm deployment assumptions for Railway backend/Postgres and Vercel frontend.

Success criteria:

- `alembic upgrade head` works against a clean database.
- Core auth, transcription, history, and deletion flows are reproducible from scratch.
- Deployment environment variables and CORS expectations are documented clearly.

## Phase 2 — Finish Clinician Style Profiles And Encounter Context

- Complete the already-started style profile work: saved note style, preferred focus, plan bullets, and patient-friendly language.
- Polish upload-time encounter selection so every transcription has a resolved encounter type.
- Ensure result and history views show the encounter type and style profile used for the note.
- Keep backend validation conservative: unknown encounter/style values normalize to safe defaults.

Expected API surface:

- Keep `POST /api/transcribe` multipart fields for `encounter_type` and optional style overrides.
- Keep `PUT /api/auth/me` as the persistence API for default documentation style.
- Extend history response only if needed to persist/display encounter and style metadata.

## Phase 3 — Charting Export Workflow

- Add chart-ready copy actions for SOAP note sections and the full note.
- Improve the existing download flow into predictable plain-text export with patient/date-aware filenames.
- Add lightweight frontend controls for copying transcript, copying SOAP, and downloading the note.
- Avoid EHR integration, browser extensions, or compliance-heavy export claims in this phase.

## Phase 4 — Source-Linked Review Mode

- Capture or derive transcript chunks so generated content can be reviewed against source evidence.
- Add a review view that compares SOAP sections with relevant transcript snippets.
- Start with heuristic links from entities, keywords, and clinical extraction data before attempting precise LLM citation mapping.
- Label evidence as supporting transcript excerpts, not definitive citations.

## Phase 5 — Small-Practice Workflow Pack And Quality Checks

- Generate optional post-visit artifacts: patient instructions and referral letter draft.
- Add specialty-aware quality checks using the existing clinical representation and quality report foundation.
- Surface missing documentation items as review prompts, not hard errors.
- Keep the workflow centered on finishing a visit: note, instructions, referral, quality checklist.

## Phase 6 — Advanced Differentiators

- Longitudinal pull-forward from prior notes after patient identity and safety rules are designed.
- Review-first coding suggestions with explicit confidence and disclaimers.
- Personal documentation memory beyond static presets.
- Small-clinic workspace features such as follow-up tasks and richer visit packaging.

## Test Strategy

- Backend: focused tests for auth, protected history access, style profile updates, transcribe request validation, and response shape.
- Frontend: `npm run build` plus manual smoke coverage for login, settings, upload, results, history, export, and review mode.
- Migration: verify `alembic upgrade head` on both clean and existing dev databases.
- End-to-end: register, upload valid audio, reject short/non-medical/unsupported inputs, inspect history, export note, delete records.
