# Features

This file tracks the project feature set by status.

## Shipped

- User registration
- User login
- JWT-based authenticated API access
- Session restore from stored token
- User account deletion
- Authenticated transcription history
- Individual transcription detail retrieval
- Delete single history item
- Delete all history
- Audio upload to backend
- Supported audio type validation
- Minimum audio duration validation
- Audio transcription
- Transcript normalization and spelling correction
- Medical content validation
- Medical entity extraction
- Medical entity categorization
- Structured clinical extraction
- SOAP note generation
- SOAP note plain-text formatting
- PostgreSQL persistence for results
- Local hybrid dev workflow scripts
- Dockerized backend
- Dockerized frontend
- Dockerized PostgreSQL for dev

## Present In UX / Product Surface

- Dashboard
- Login page
- History page
- Settings page
- Result cards for transcript, entities, and SOAP note

## In Progress Or Partially Complete

- Alembic migration workflow
- Clinician-specific note style profiles
- Encounter type selection before upload
- Production deployment
- Finalized documentation alignment across the repo
- More formal QA and automated verification

## Planned / Expected Next

- Local PostgreSQL verification for the first Alembic migration
- Complete style profile and encounter context polish
- Chart-ready copy/export workflow
- Source-linked review mode
- Patient instructions and referral letter workflow
- Specialty-aware quality checks
- Deployment hardening
- Better smoke testing
- More explicit operational runbooks
- More polished contributor onboarding

## Feature Notes

- The transcription flow is protected behind authentication.
- The backend returns validation failures early and skips entity extraction / SOAP generation when content is not considered medical.
- History data is persisted on the server and cached in the frontend store for responsiveness.
- Feature development is now organized into six phases in `context/PLAN.md`.
