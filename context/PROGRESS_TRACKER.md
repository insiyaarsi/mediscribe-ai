# Progress Tracker

Status snapshot date: 2026-04-25

## Product Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend API foundation | Complete | FastAPI app, health, auth, history, transcription endpoints exist |
| Authentication | Complete | Register, login, `/api/auth/me`, account delete, bearer auth |
| Database schema | Complete with caveat | ORM schema exists and persists data; migration workflow still pending |
| Alembic migrations | In progress | Initialized, but not yet fully adopted |
| Transcription pipeline | Complete | Upload, transcription, normalization, validation, extraction, SOAP generation |
| Medical validation | Complete | Invalid clinical content is rejected before downstream steps |
| Entity extraction | Complete | `scispacy` plus dictionary-based categorization |
| SOAP generation | Complete | Structured output present in API flow |
| Frontend core UI | Complete | Login, dashboard, history, settings |
| Frontend/backend integration | Complete | Auth, history, upload, result rendering are wired |
| Local dev workflow | Complete | Dedicated scripts for DB, backend, frontend |
| Dockerization | Complete | Backend, frontend, and Postgres services configured |
| Deployment | Not complete | Planned but still needs execution and verification |
| Automated testing / CI | In progress | Some validation docs exist; formal automation still needs work |
| Documentation | In progress | New baseline docs added, but old docs still coexist |

## Milestone View

| Milestone | Status |
| --- | --- |
| MVP transcription flow | Complete |
| Multi-user auth and persistence | Complete |
| Production-like local environment | Complete |
| Migration-safe database workflow | In progress |
| Public deployment readiness | In progress |
| Final polish and handoff readiness | In progress |

## Active Blockers / Gaps

- Migration-first workflow is not done yet
- Deployment runbook is not fully locked in
- Historical docs in the repo are mixed-era and need careful interpretation
