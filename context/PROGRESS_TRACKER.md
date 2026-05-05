# Progress Tracker

Status snapshot date: 2026-05-04

## Product Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend API foundation | Complete | FastAPI app, health, auth, history, transcription endpoints exist |
| Authentication | Complete | Register, login, `/api/auth/me`, account delete, bearer auth |
| Database schema | Complete with caveat | ORM schema exists and persists data; migration workflow still pending |
| Alembic migrations | In progress | Baseline migration added; local/backend startup now runs `alembic upgrade head` |
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
| Phase roadmap | Locked | Six-phase roadmap accepted and recorded in `context/PLAN.md` |
| Clinician style profiles | Partially complete | Backend/user fields and settings UI exist; result/history metadata polish remains |
| Encounter context | Partially complete | Upload selection and backend normalization exist; persistence/display polish remains |
| Charting export workflow | Planned | Copy/download workflow is next after style/encounter completion |
| Source-linked review mode | Planned | Requires transcript evidence/chunk design |
| Post-visit workflow pack | Planned | Patient instructions, referral draft, and quality checks planned later |

## Milestone View

| Milestone | Status |
| --- | --- |
| MVP transcription flow | Complete |
| Multi-user auth and persistence | Complete |
| Production-like local environment | Complete |
| Migration-safe database workflow | In progress |
| Public deployment readiness | In progress |
| Final polish and handoff readiness | In progress |
| Phase 1 foundation stabilization | In progress |
| Phase 2 style and encounter polish | Planned |
| Phase 3 charting export workflow | Planned |
| Phase 4 source-linked review | Planned |
| Phase 5 workflow pack and quality checks | Planned |
| Phase 6 advanced differentiators | Future |

## Active Blockers / Gaps

- Migration-first workflow is not done yet
- Deployment runbook is not fully locked in
- Historical docs in the repo are mixed-era and need careful interpretation
- Future feature work should proceed phase by phase from `context/PLAN.md`
