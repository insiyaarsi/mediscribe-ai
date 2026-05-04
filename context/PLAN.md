# Plan

This plan reflects the current project state as of 2026-04-25.

## Immediate Priorities

1. Finish the documentation baseline so project state is easy to understand.
2. Formalize Alembic migrations so schema changes stop depending on startup fallback behavior.
3. Verify the full local development path from clean setup through authenticated transcription.

## Near-Term Engineering Work

1. Create the first real migration set for `users`, `transcriptions`, `medical_entities`, and `soap_notes`.
2. Define migration workflow for local development, first boot, and deployment.
3. Run a clean-environment smoke test for backend, frontend, auth, upload, history, and deletion flows.
4. Review deployment assumptions for Railway backend/Postgres and Vercel frontend.

## Medium-Term Work

1. Add stronger testing around auth, history, and the transcription response contract.
2. Improve operational docs for environment variables and deployment.
3. Tighten product polish on frontend flows, validation messaging, and reliability.

## Longer-Term Opportunities

1. CI checks for linting, build, and smoke tests
2. More robust observability / error logging
3. Better demo packaging for admissions and recruiter review
4. More advanced medical note quality evaluation

## Constraints To Keep In Mind

- Existing `README.md` must remain untouched unless explicitly requested
- Some repo docs are older than the current code state
- Alembic is partially initialized but not yet the live migration source of truth
- The project is intentionally trying to stay low-cost

## Success Criteria For The Next Phase

- New contributor can get the app running quickly
- Database schema changes are migration-driven
- Core auth and transcription flows are reproducible from scratch
- Deployment path is documented clearly enough to execute without guesswork
