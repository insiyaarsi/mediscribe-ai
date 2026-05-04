# Fix Log

This file captures important fixes and stability changes already reflected in the current codebase.

## Confirmed Fixes / Improvements

### Backend / Data

- Added eager loading with `selectinload` for history endpoints to avoid lazy-load failures during response serialization.
- Kept startup table creation as a safe fallback so first boot does not fail before real migrations exist.
- User-scoped access checks are enforced for history detail and delete routes.

### Auth

- Login returns the same failure shape for missing-user and wrong-password cases to reduce email enumeration risk.
- Session restore is handled through token storage plus `/api/auth/me`.

### Transcription Pipeline

- Switched primary ASR to `faster-whisper`.
- Added transcript normalization / medical spelling correction to the live pipeline.
- Added early return for recordings below the minimum audio duration threshold.
- Validation failures now stop the pipeline cleanly before entity extraction and SOAP generation.

### Entity / SOAP Quality

- Dictionary fallback entity scanning was expanded so categorization is more complete.
- Clinical extraction was added to support better SOAP generation quality.

### Frontend

- Axios timeout was increased to support longer transcription jobs.
- API base URL handling was improved for empty `VITE_API_URL`.
- Token writing responsibilities were narrowed so the store no longer writes tokens directly.
- Session restore behavior in `App.tsx` was adjusted to avoid cancelling its own history fetch.
- Upload flow cleanup improved blob URL lifecycle handling.
- Frontend now passes `X-Audio-Duration-Seconds` so the backend can short-circuit very short uploads.

### Infra / Dev Workflow

- Docker dependency wiring was corrected so frontend waits on backend and backend waits on healthy database.
- Nginx proxy timeout was increased for long-running transcription requests.
- Hybrid local-dev scripts were added to avoid unnecessary container rebuilds during day-to-day work.

## Still Open

- Alembic migrations are still not complete for a real migration-first workflow.
- Deployment verification remains a pending milestone.
- Existing historical docs in the repo still need alignment with the latest architecture.
