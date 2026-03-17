# MediScribe AI — Project Memory File

---

## 1. Project Summary

**Project Name:** MediScribe AI

**Description:** A production-ready medical transcription system that converts doctor-patient conversations into structured clinical documentation. Uses speech-to-text AI to transcribe audio, extracts medical entities (symptoms, medications, diagnoses), generates formatted SOAP notes, and provides secure multi-user access with database persistence. Reduces physician documentation time from 8 minutes to 3 minutes per patient.

**Primary Goals:**
- Build a complete portfolio project for Canadian university applications (McGill, Concordia, Windsor, Carleton) AND job applications
- Demonstrate advanced AI/ML skills with real-world healthcare application
- Create a fully functional, deployed demo accessible via public URL
- Demonstrate production engineering skills (Docker, PostgreSQL, authentication, deployment)
- Keep the entire project 100% FREE — SOAP generation uses Groq free tier (llama-3.3-70b-versatile), all other infrastructure is free
- **REVISED Timeline:** 20-week development cycle (expanded from original 12 weeks)

**Student Context:**
- Working 15-20 hours/week on project
- Most free on Mondays
- GRE exam COMPLETED on December 26th, 2025
- In IST timezone
- GitHub username: insiyaarsi
- Repository: https://github.com/insiyaarsi/mediscribe-ai
- Active development branch: `recent-updates` (main branch preserved with old frontend)

**Timeline Revision:**
- Original Plan: 12 weeks (basic demo)
- Revised Plan: 20 weeks (production-ready system with database, auth, Docker, deployment)
- New Target Completion: May 2026

---

## 2. Architecture Overview

### Technologies Used

**Backend:**
- FastAPI (Python) — High-performance async API framework
- Whisper (OpenAI) — LOCAL speech-to-text (runs offline, no API needed)
- Python 3.12
- Uvicorn — ASGI server
- python-dotenv — Environment variable management
- scispacy (v0.6.2) — Medical entity extraction
- spaCy — NLP framework
- en_ner_bc5cdr_md (v0.5.4) — Biomedical NLP model. Returns CHEMICAL and DISEASE labels. Dictionary scan second pass adds SYMPTOM, TEST, PROCEDURE labels.
- SQLAlchemy 2.0.23 — ORM for database operations (COMPLETE — Week 12)
- Alembic 1.13.1 — Database migrations (installed, not yet used — tables created via metadata.create_all)
- python-jose[cryptography] 3.3.0 — JWT token generation (COMPLETE — Week 12)
- passlib[bcrypt] 1.7.4 + bcrypt 4.0.1 — Password hashing (COMPLETE — Week 12)
- psycopg2-binary 2.9.9 — PostgreSQL driver
- pydantic[email] — Email validation for auth schemas
- groq Python SDK — Groq SOAP generation via llama-3.3-70b-versatile
- rapidfuzz 3.6.1 — Fuzzy matching utilities

**Database:**
- PostgreSQL 16 (Alpine) — Running as Docker container in development
- Schema: users, transcriptions, medical_entities, soap_notes (ALL COMPLETE)
- Tables created automatically via `models.Base.metadata.create_all(bind=engine)` on startup
- Alembic is installed but migrations are not yet written — create_all handles first boot

**Authentication:**
- JWT (JSON Web Tokens) — COMPLETE and working
- Token stored in sessionStorage by default, localStorage if "Remember me" is checked
- 7-day token expiry
- bcrypt password hashing
- get_current_user() FastAPI dependency used on all protected routes

**Containerisation — COMPLETE (Week 12):**
- `Dockerfile` — backend (Python 3.12-slim, ffmpeg, pip install, Whisper pre-download)
- `Dockerfile.frontend` — multi-stage: Node 20 builds Vite, Nginx serves static output
- `docker-compose.yml` — three services: backend (port 8000), frontend (port 80), db (PostgreSQL)
- `nginx.conf` — proxies /api/ to backend, SPA fallback, static asset caching
- `.dockerignore` — excludes node_modules, .env, __pycache__, dist, .git

**Deployment (NOT YET STARTED):**
- Railway — Backend + PostgreSQL (Weeks 15-16)
- Vercel — Frontend (Weeks 15-16)

**Development Environment:**
- GitHub Codespaces — 32GB storage (fixed limit on free plan, cannot upgrade)
- Docker running all three services inside Codespaces
- Storage management: always run `docker system prune -a -f` BEFORE `docker compose up --build` to avoid hitting the 32GB limit during layer replacement
- Rebuild workflow: `docker compose down` → `docker system prune -a -f` → `docker compose up --build`

**Audio Processing:**
- ffmpeg — Audio file handling
- Whisper base model (140MB) — pre-downloaded during Docker build, cached in named volume `whisper-cache`

**Frontend (FULLY REBUILT - Week 9, DARK MODE COMPLETE - Week 11, AUTH COMPLETE - Week 12):**
- React 19 + TypeScript (.tsx files) — NOTE: package.json shows React 19, not 18 as previously noted
- Vite 7 — Build tool
- **Tailwind CSS — CONFIRMED RUNNING v4** (index.css uses `@import "tailwindcss"` — v4 syntax). tailwind.config.js exists but v4 IGNORES it. See Section 20 for full details.
- shadcn/ui — Base component library
- Framer Motion — Animations
- Lucide React — Icons
- Axios — HTTP client with request/response interceptors for JWT
- Zustand 5 — State management (with persist middleware)
- Sonner — Toast notifications
- date-fns — Date formatting
- clsx + tailwind-merge + class-variance-authority — Class utilities

---

### File/Folder Structure

```
mediscribe-ai/
├── .env                          # Environment variables (NOT in Git)
│                                 # Required vars: GROQ_API_KEY, DATABASE_URL, JWT_SECRET_KEY
│                                 # Optional: CORS_ORIGINS (comma-separated list)
├── .gitignore
├── .dockerignore
├── Dockerfile                    # Backend image (NEW — Week 12)
├── Dockerfile.frontend           # Frontend image, multi-stage (NEW — Week 12)
├── docker-compose.yml            # Orchestrates backend + frontend + db (NEW — Week 12)
├── nginx.conf                    # Nginx config for frontend container (NEW — Week 12)
├── README.md                     # FULLY REWRITTEN in Week 11 — screenshots still missing
├── backend/
│   ├── main.py                  # Main API server — REWRITTEN Week 12 (auth + DB endpoints)
│   ├── database.py              # SQLAlchemy engine + get_db() dependency (NEW — Week 12)
│   ├── models.py                # ORM models: User, Transcription, MedicalEntity, SoapNote (NEW — Week 12)
│   ├── schemas.py               # Pydantic request/response schemas (NEW — Week 12)
│   ├── auth.py                  # Password hashing, JWT create/verify, get_current_user (NEW — Week 12)
│   ├── lib/
│   │   ├── __init__.py          # Empty — makes lib/ a Python package (NEW — Week 12)
│   │   └── utils.py             # generate_patient_id(), estimate_duration() (NEW — Week 12)
│   ├── transcription.py         # Whisper transcription (unchanged)
│   ├── entity_extraction.py     # Two-pass extraction (NER + dictionary scan) — unchanged from post-Week 11
│   ├── medical_categories.py    # Medical term dictionaries (837 terms) — unchanged
│   ├── medical_categories_backup.py
│   ├── soap_generator.py        # SOAP note generation (Groq-powered) — unchanged
│   ├── content_validator.py     # Medical content validation — unchanged
│   ├── spell_correction.py      # DISABLED — built but not used
│   └── requirements.txt         # UPDATED Week 12 — added DB + auth packages
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tsconfig.app.json
    ├── tailwind.config.js        # EXISTS but ignored by Tailwind v4
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── App.tsx              # UPDATED Week 12 — session restore on load
        ├── main.tsx             # Entry point with Toaster
        ├── index.css            # Global styles — uses @import "tailwindcss" (v4)
        ├── types/
        │   └── index.ts         # All TypeScript interfaces
        ├── lib/
        │   └── utils.ts         # getEntityColors, getEntityDotColor, cn, etc.
        ├── services/
        │   └── api.ts           # REWRITTEN Week 12 — JWT interceptors, auth + history API calls
        ├── store/
        │   └── appStore.ts      # REWRITTEN Week 12 — auth state, server-backed history
        └── components/
            ├── layout/
            │   ├── Sidebar.tsx  # UPDATED Week 12 — logout calls clearAuth()
            │   └── TopBar.tsx   # Sticky header — full dark mode
            └── features/
                ├── upload/
                │   ├── StatsBar.tsx
                │   ├── UploadZone.tsx
                │   ├── UploadCard.tsx
                │   └── TranscribeButton.tsx  # UPDATED Week 12 — refreshes history from API after transcription
                └── results/
                    ├── ResultsPanel.tsx
                    ├── TranscriptionCard.tsx
                    ├── EntitiesCard.tsx
                    ├── EntityChip.tsx
                    └── SOAPNoteCard.tsx
        └── pages/
            ├── LoginPage.tsx    # REWRITTEN Week 12 — real auth API calls, remember me, history fetch on login
            ├── DashboardPage.tsx
            ├── HistoryPage.tsx  # UPDATED Week 12 — backend-backed delete, view/download fetch full record
            └── SettingsPage.tsx # UPDATED Week 12 — Clear History + Delete Account hit backend
```

---

## 3. Design System

**Approved Prototype:** mediscribe-prototype-v3.html (on file, use as reference)

**Colour Palette — Light Mode:**
- Primary blue: `#1A56DB`
- Accent green: `#0BA871`
- Sidebar navy: `#0D1B2A`
- Background: `#F0F4F8`
- Card white: `#FFFFFF`
- Border: `#E2E8F0`
- Muted text: `#94A3B8`

**Colour Palette — Dark Mode:**
- Dark background: `#0F172A`
- Dark card: `#1E293B`
- Dark card alt (deeper): `#0F172A`
- Dark border: `#334155`
- Dark heading text: `#F1F5F9`
- Dark body text: `#94A3B8`
- Dark muted text: `#4A6080`
- Dark hover row: `#243150`
- Dark alt row: `#1A2540`

**Entity chip colours — light mode (hex values, used as inline styles):**
- SYMPTOM:    bg `#FEF2F2`, border `#EF4444`, text `#991B1B`
- MEDICATION: bg `#EFF6FF`, border `#3B82F6`, text `#1E40AF`
- CONDITION:  bg `#FAF5FF`, border `#A855F7`, text `#6B21A8`
- PROCEDURE:  bg `#F0FDF4`, border `#22C55E`, text `#166534`
- TEST:       bg `#FFFBEB`, border `#F59E0B`, text `#92400E`
- OTHER:      bg `#F8FAFC`, border `#94A3B8`, text `#475569`

**Entity chip colours — dark mode (hex values, used as inline styles):**
- SYMPTOM:    bg `#3A1A1A`, border `#F87171`, text `#FECACA`
- MEDICATION: bg `#172554`, border `#93C5FD`, text `#DBEAFE`
- CONDITION:  bg `#2E1065`, border `#C4B5FD`, text `#E9D5FF`
- PROCEDURE:  bg `#052E16`, border `#86EFAC`, text `#DCFCE7`
- TEST:       bg `#451A03`, border `#FCD34D`, text `#FEF3C7`
- OTHER:      bg `#1E293B`, border `#CBD5E1`, text `#E2E8F0`

**Dark mode SOAP section header backgrounds (SOAPNoteCard):**
- S (Subjective): `#172554`
- O (Objective): `#052E16`
- A (Assessment): `#2E1065`
- P (Plan): `#451A03`

**Typography:**
- Headings: Sora (font-head)
- Body: DM Sans (font-sans)
- Monospace/data: IBM Plex Mono (font-mono)

**Border radius:** 10px default, 14px for cards
**Sidebar widths:** 220px expanded, 60px collapsed
**TopBar height:** 54px

---

## 4. Frontend Architecture

### Zustand Store (`src/store/appStore.ts`) — REWRITTEN Week 12

Persisted to localStorage via `zustand/middleware/persist`. Key: `mediscribe-storage`.

**Persisted slices (Week 12 — reduced from previous):**
- `preferences` — Preferences (autoScroll, compactView, showConfidence, autoCopy, darkMode)
- `notifications` — NotificationSettings (emailNotifs, transcriptDone, weeklyReport)
- `sidebarCollapsed` — boolean

**Intentionally NOT persisted (server is source of truth):**
- `history` — loaded from API on login, NOT in localStorage
- `profile` — populated from JWT login response, NOT in localStorage
- `uploadState`, `selectedFile`, `transcriptionResult`, `processingStatus`, `errorMessage`
- `currentPage` — resets to `login` on reload
- `isAuthenticated`, `authUser`

**Actions:**
- `setPage(page)`, `toggleSidebar()`
- `setAuth(user, token)` — writes token to storage, populates profile, clears history
- `clearAuth()` — removes token, removes `mediscribe-storage` from localStorage, resets all user state, navigates to login
- `setFile(file)`, `setUploadState(state)`, `setProcessingStatus(msg)`, `setResult(result)`, `setError(msg)`, `clearUpload()`
- `addToHistory(result, file)` — fallback only, used when API history refresh fails
- `setHistory(entries)` — replaces history array from API data
- `deleteHistoryItem(id)`, `clearHistory()`
- `updateProfile(partial)`, `updatePreferences(partial)`, `updateNotifications(partial)`
- `resetSettings()` — restores preferences and notifications to defaults only (not profile)

### Token Storage Pattern (api.ts)

```typescript
const TOKEN_KEY = 'mediscribe_token'

getStoredToken()     // reads sessionStorage first, then localStorage
setStoredToken(token, remember)  // remember=true → localStorage, false → sessionStorage
clearStoredToken()   // clears both
```

Default (remember=false): token in sessionStorage — tab-scoped, cleared when tab closes.
Remember me checked: token in localStorage — survives tab close, restored by App.tsx session restore.

This solves the multi-tab session conflict — two tabs with different users each have their own sessionStorage.

### Session Restore (App.tsx)

On app load, App.tsx runs a useEffect:
1. Calls `getStoredToken()` — checks sessionStorage then localStorage
2. If token found and not already authenticated, calls `GET /api/auth/me`
3. On success: calls `setAuth()`, fetches history, calls `setHistory()`, navigates to dashboard
4. On failure (expired/invalid token): calls `clearAuth()`

This means users with "Remember me" checked are restored to the dashboard after a page reload without re-entering credentials.

### API Service (`src/services/api.ts`) — REWRITTEN Week 12

Base URL: `import.meta.env.VITE_API_URL || 'http://localhost:8000'`
In Docker: `VITE_API_URL` is set to empty string at build time. Frontend calls `/api/...` on its own origin. Nginx proxies `/api/` to the backend container.

**Request interceptor:** reads token via `getStoredToken()`, attaches as `Authorization: Bearer <token>` on all requests EXCEPT `/api/auth/login` and `/api/auth/register` (to avoid stale token causing 401 on login itself).

**Response interceptor:** on 401 from non-auth endpoints, clears both token stores and reloads the page (forces login).

**Exported functions:**
- `loginUser(email, password)` → `AuthResponse`
- `registerUser(payload)` → `AuthResponse`
- `fetchCurrentUser()` → `UserPublic`
- `deleteMyAccount()` → void
- `fetchHistory()` → `HistoryEntryAPI[]`
- `fetchTranscription(id)` → `HistoryEntryAPI` (full record with entities + SOAP)
- `deleteHistoryItem(id)` → void
- `deleteAllHistory()` → void
- `mapHistoryEntryFromApi(entry)` → `HistoryEntry` (summary shape for Zustand)
- `mapHistoryDetailToResult(entry)` → `TranscriptionResult` (full result for dashboard view)
- `transcribeAudio(file)` → `TranscriptionResult`

### TypeScript Types (`src/types/index.ts`)

```typescript
MedicalEntity        { text, label, confidence, start, end }
SOAPNote             { subjective, objective, assessment, plan }
TranscriptionResult  { transcription, entities, soap_note, confidence_score }
EntityCategory       'SYMPTOM' | 'MEDICATION' | 'CONDITION' | 'PROCEDURE' | 'TEST' | 'OTHER'
GroupedEntities      { symptoms, medications, conditions, procedures, tests, other }
HistoryEntry         { id, date, patientId, duration, entityCount, confidenceScore, status, result? }
UploadState          'idle' | 'selected' | 'processing' | 'done' | 'error'
AppPage              'login' | 'dashboard' | 'history' | 'settings'
UserProfile          { firstName, lastName, email, specialty, hospital, licenseNo, avatarUrl }
Preferences          { autoScroll, compactView, showConfidence, autoCopy, darkMode }
NotificationSettings { emailNotifs, transcriptDone, weeklyReport }
```

### Utility Functions (`src/lib/utils.ts`) — unchanged from post-Week 11

- `cn(...inputs)` — Tailwind class merging
- `getEntityCategory(label)` — maps label string to EntityCategory
- `groupEntities(entities)` — groups flat array into GroupedEntities with deduplication
- `formatConfidence(score)` — 0-1 or 0-100 to percentage string
- `getEntityColors(category, darkMode?)` — returns `{ bg, border, text }` hex strings for inline styles
- `getEntityDotColor(category, darkMode?)` — returns single hex string for category dot
- `generatePatientId()` — returns PT-##### string
- `formatDate(date)` — returns "Feb 20, 2026 · 9:14 AM"

**REMOVED and must never return: `getEntityStyles()`** — see Section 20.

### EntityChip and EntitiesCard — unchanged from post-Week 11

Both use inline styles for all runtime colours. See Section 20 for why.

### Routing

Handled by Zustand `currentPage` state, not React Router. App.tsx conditionally renders pages.

---

## 5. Pages — Current State

### LoginPage — REWRITTEN Week 12
- Calls real `loginUser()` / `registerUser()` API functions
- On success: calls `setStoredToken()`, then `setAuth()`, then `fetchHistory()`, then navigates to dashboard
- Remember me checkbox controls sessionStorage vs localStorage token placement
- Register form collects firstName, lastName, specialty
- Google SSO: toast ("coming in a future update") — not scheduled
- AuthField sub-component accepts `dark: boolean` prop

### DashboardPage
Thin wrapper only. StatsBar + UploadCard + ResultsPanel handle dark mode internally.

### HistoryPage — UPDATED Week 12
- All delete operations (single item, delete all) call backend API before updating local state
- handleView: if `entry.result` is undefined (server-loaded summary), fetches full record via `fetchTranscription(id)` then reconstructs result using `mapHistoryDetailToResult()`
- handleDownload: same pattern — fetches full record if needed before building the .txt file
- toPlainText() handles both string and object/dict SOAP section values safely

### SettingsPage — UPDATED Week 12
- "Clear History" in Danger Zone calls `DELETE /api/history` (backend) before clearing local state
- "Delete Account" added to Danger Zone — calls `DELETE /api/auth/me`, then `clearAuth()`
- Delete Account has confirmation modal
- All 5 tabs, full dark mode

### Sidebar — UPDATED Week 12
- Logout button calls `clearAuth()` (not just `setPage('login')`)
- `clearAuth()` is destructured from `useAppStore()`
- Sign out shows `toast.success('Sign Out Successfull')` — note the intentional double-l typo matches what was shipped

### TopBar
Full dark mode. No changes this session.

---

## 6. Component Dark Mode Implementation Pattern

```tsx
const { preferences } = useAppStore()
const dark = preferences.darkMode

<div className={cn(
  'border rounded-[14px]',
  dark ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E2E8F0]'
)}>
```

Sub-components that need dark mode receive `dark: boolean` as an explicit prop.

**Do NOT use Tailwind `dark:` variants.** Use the `cn()` conditional pattern with `preferences.darkMode`.

**Do NOT return Tailwind class strings for colours from runtime functions.** See Section 20.

---

## 7. Backend — Current State

### Database Models (models.py) — NEW Week 12

```python
User             — id, email, hashed_password, first_name, last_name, specialty, hospital, license_no, is_active, created_at
Transcription    — id, user_id (FK), patient_id, filename, transcription, confidence_score (0-100), duration, status, created_at
MedicalEntity    — id, transcription_id (FK), text, label, confidence, start, end
SoapNote         — id, transcription_id (FK, unique), subjective, objective, assessment, plan, source, created_at
```

Cascade: deleting a User deletes all their Transcriptions. Deleting a Transcription cascades to MedicalEntity and SoapNote rows. This is via SQLAlchemy `cascade="all, delete-orphan"` on relationships.

### Auth (auth.py) — NEW Week 12

- `hash_password(plain)` — bcrypt hash
- `verify_password(plain, hashed)` — bcrypt verify
- `create_access_token(user_id)` — signs JWT with HS256, 7-day expiry
- `get_current_user(credentials, db)` — FastAPI dependency, reads Bearer token, returns User ORM object or raises 401

SECRET_KEY read from `JWT_SECRET_KEY` env var. Will raise RuntimeError on startup if not set.

### API Endpoints (main.py) — COMPLETE Week 12

**Auth:**
- `POST /api/auth/register` — creates user, returns token + user
- `POST /api/auth/login` — verifies credentials, returns token + user
- `GET /api/auth/me` — returns current user profile (protected)
- `DELETE /api/auth/me` — deletes account + all data via ORM cascade (protected)

**History:**
- `GET /api/history` — returns all transcriptions for current user, newest first (protected)
- `GET /api/history/{id}` — returns single transcription with entities + SOAP note (protected)
- `DELETE /api/history/{id}` — deletes single transcription (protected, 403 if wrong user)
- `DELETE /api/history` — deletes ALL transcriptions for current user using ORM deletion (protected)

**Transcription:**
- `POST /api/transcribe` — full pipeline: transcribe → validate → extract entities → generate SOAP → persist to DB (protected)
- Returns full result including `db_id` of the persisted record

**Other:**
- `GET /` — root info
- `GET /health` — health check (used by Docker health check)
- `POST /api/download` — returns SOAP note as downloadable .txt (unprotected)

### CORS (main.py) — FIXED Week 12

`allow_origins=["*"]` with `allow_credentials=True` is invalid for browsers. Fixed to explicit origin list:

```python
default_cors_origins = [
    "http://localhost", "http://127.0.0.1",
    "http://localhost:3000", "http://127.0.0.1:3000",
    "http://localhost:4173", "http://127.0.0.1:4173",
    "http://localhost:5173", "http://127.0.0.1:5173",
    "http://localhost:8080", "http://127.0.0.1:8080",
]
cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", ",".join(default_cors_origins)).split(",") if o.strip()]
```

For Railway deployment, set `CORS_ORIGINS` env var to the Vercel frontend URL.

### Two-Pass Entity Extraction — unchanged from post-Week 11

Pass 1: en_ner_bc5cdr_md NER → CHEMICAL, DISEASE labels
Pass 2: dictionary scan → SYMPTOM, TEST, PROCEDURE labels (confidence: 0.0, correct)

Label flow:
```
CHEMICAL  → getEntityCategory() → MEDICATION
DISEASE   → getEntityCategory() → CONDITION
SYMPTOM   → getEntityCategory() → SYMPTOM
TEST      → getEntityCategory() → TEST
PROCEDURE → getEntityCategory() → PROCEDURE
```

### SOAP Generation — unchanged

- Model: `llama-3.3-70b-versatile` via Groq free tier
- Fallback: rule-based generation if Groq fails
- SOAP sections from Groq: plain prose strings
- SOAP sections from fallback: structured dicts
- `_to_str()` in main.py handles both when persisting to DB

### Critical — main.py import order

```python
from dotenv import load_dotenv
load_dotenv()   # MUST be before ALL local imports

from fastapi import FastAPI, ...
from database import get_db, engine
from auth import hash_password, verify_password, create_access_token, get_current_user
import models
import schemas
from lib.utils import generate_patient_id, estimate_duration
```

---

## 8. API Response Structure

**Success response from `POST /api/transcribe`:**
```json
{
  "success": true,
  "filename": "audio.mp3",
  "transcription": "...",
  "validation": { "is_valid": true, "confidence_score": 0.87 },
  "entities": {
    "total": 30,
    "breakdown": {},
    "categorized": {},
    "all_entities": [
      { "text": "chest pain",  "label": "DISEASE",   "confidence": 0.95, "start": 0, "end": 10 },
      { "text": "fatigue",     "label": "SYMPTOM",   "confidence": 0.0,  "start": 0, "end": 7  },
      { "text": "ECG",         "label": "TEST",      "confidence": 0.0,  "start": 0, "end": 3  },
      { "text": "aspirin",     "label": "CHEMICAL",  "confidence": 0.92, "start": 0, "end": 7  }
    ]
  },
  "soap_note": { "subjective": "...", "objective": "...", "assessment": "...", "plan": "..." },
  "soap_note_text": "...",
  "db_id": 42
}
```

**Auth response from `POST /api/auth/login` and `POST /api/auth/register`:**
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": { "id": 1, "email": "...", "first_name": "...", "last_name": "...", "specialty": "...", "hospital": null, "license_no": null }
}
```

**History response from `GET /api/history`:**
Array of HistoryEntryOut objects, each with id, patient_id, filename, transcription, confidence_score (0-100), duration, status, created_at, entities[], soap_note.

---

## 9. Docker Setup — COMPLETE Week 12

### docker-compose.yml services

```
backend   — python:3.12-slim, port 8000, whisper-cache volume, health check GET /health
frontend  — nginx:stable-alpine, port 80, depends_on backend (service_healthy)
db        — postgres:16-alpine, port 5432, postgres-data volume, health check pg_isready
```

### Environment variables required in .env

```
GROQ_API_KEY=<your key>
DATABASE_URL=postgresql://mediscribe:mediscribe_dev_password@db:5432/mediscribe
JWT_SECRET_KEY=<generate: python -c "import secrets; print(secrets.token_hex(32))">
CORS_ORIGINS=<optional, defaults to localhost variants>
```

### Dockerfile highlights

- Backend: pip install layer comes before COPY source — exploits Docker layer cache so code changes don't re-run pip
- Backend: Whisper base model pre-downloaded at build time via `RUN python -c "import whisper; whisper.load_model('base')"`
- Frontend: multi-stage — Node builds, Nginx serves. VITE_API_URL set to empty string so frontend calls /api/ on its own origin
- nginx.conf: /api/ proxied to backend:8000, SPA fallback for all other routes, 1-year cache headers for hashed assets

### Storage management (CRITICAL for Codespaces)

Codespaces is limited to 32GB storage (cannot be upgraded on free plan). Docker images are large (~9GB for backend + frontend combined). Always use this workflow:

```bash
docker compose down
docker system prune -a -f    # reclaims ~9GB before rebuild
docker compose up --build
```

Never run `docker compose up --build` while old images are still present — the brief period where old and new layers both exist can hit the storage limit.

---

## 10. Known Limitations and Remaining TODOs

- Screenshots for README — still not taken (student takes these manually)
- SOAP note edits are local React state only — not persisted to DB (planned: `PATCH /api/soap/{id}`)
- Profile photo stored as null — no avatar upload yet
- Negation detection not implemented ("denies chest pain" still extracts "chest pain")
- Alembic migrations not written — schema managed via `create_all` for now. Before Railway deployment, proper Alembic migrations should be written
- Password reset — UI shows toast "coming in a future update", not scheduled
- Google SSO — UI shows toast "coming in a future update", not scheduled
- `HistoryEntry.status` type in types/index.ts should be verified — `mapHistoryStatus()` in api.ts maps 'complete'/'completed'/'success' → 'complete', 'processing'/'pending'/'in_progress' → 'processing', everything else → 'failed'

---

## 11. Development Commands

```bash
# Run everything via Docker (recommended — matches production)
docker compose down
docker system prune -a -f
docker compose up --build

# Frontend available at: http://localhost (port 80 via Nginx)
# Backend API available at: http://localhost:8000
# Backend API docs: http://localhost:8000/docs

# Code-only change rebuild (no dependency changes) — faster
docker compose down
docker compose up --build   # skips pip install and npm ci layers

# Git
git add . && git commit -m "description" && git push origin recent-updates
```

---

## 12. Progress Snapshot — As of March 15, 2026

### Completed

**Weeks 1-2:** Backend foundation — FastAPI, Whisper, scispacy, entity extraction, content validation

**Week 8:** UI/UX prototype design (v1, v2, v3 HTML prototypes)

**Week 9:** Full React 19 + TypeScript frontend rebuild

**Week 9.5:** Backend improvements — en_ner_bc5cdr_md upgrade, Groq SOAP generation, 4 physician review cycles

**Week 10:** Frontend testing — all 5 scenarios

**Week 11:** Full dark mode across all pages and components, README rewritten

**Post-Week 11:** Entity categorisation fix, entity chip colour fix (Tailwind v4 inline styles)

**Week 12 (current session — COMPLETE):**
- Docker containerisation: Dockerfile, Dockerfile.frontend, docker-compose.yml, nginx.conf, .dockerignore
- PostgreSQL: 4 tables, SQLAlchemy models, cascade deletion
- JWT authentication: register, login, token storage (session vs local), session restore on reload
- Protected routes: /api/transcribe, /api/history, /api/auth/me, /api/history/{id}
- User-scoped history: each user sees only their own transcriptions
- History persistence: transcriptions saved to DB on creation, loaded from DB on login
- Delete operations: single delete, delete all, account deletion — all backend-backed
- History view/download: fetches full record from API when summary-only entry is clicked
- CORS fixed: explicit origin list instead of wildcard
- Frontend auth flow: LoginPage calls real API, App.tsx restores sessions
- TranscribeButton: refreshes history from API after transcription instead of adding local-only entry
- SettingsPage: Clear History and Delete Account wired to backend

### Not Yet Started
- Screenshots for README (manual task — take before next session)
- Alembic migrations
- Deployment to Railway + Vercel (Weeks 15-16)
- Testing and QA (Week 14)
- User testing (Week 17)
- Documentation and demo video (Weeks 18-19)
- Final polish and launch (Week 20)

---

## 13. Next Steps — Priority Order

**1. Screenshots for README** — take before any development:
- Dashboard light mode — completed transcription with all entity categories visible
- Dashboard dark mode — same state, dark toggled
- History page with entries
- Login page

**2. Testing and QA (Week 14):**
- Full end-to-end test of the auth + history flow
- Test session restore (remember me)
- Test account deletion
- Test delete all history
- Verify entity colours in both light and dark mode
- Verify SOAP note view and download from history

**3. Alembic migrations (before Railway deployment):**
- `alembic init alembic`
- Write initial migration from existing models
- Test migration applies cleanly on a fresh database
- This replaces the `create_all` approach for production

**4. Deployment (Weeks 15-16):**
- Railway: deploy backend + attach PostgreSQL plugin
- Set environment variables on Railway: GROQ_API_KEY, JWT_SECRET_KEY, CORS_ORIGINS (Vercel URL)
- Railway injects DATABASE_URL automatically when PostgreSQL plugin is attached
- Vercel: deploy frontend, set VITE_API_URL to Railway backend URL
- Update nginx.conf or frontend base URL for production

---

## 14. Backend Remaining Improvement Backlog

**SOAP note edit persistence:** `PATCH /api/soap/{id}` endpoint — medium priority, do after deployment.

**Complaint-based smart templates:** Detect chief complaint, inject complaint-specific checklist into SOAP prompt. Low priority.

**Medication normalisation verification:** Post-processing layer with RapidFuzz formulary check. Low priority.

---

## 15. Resume / Portfolio Notes

"Built MediScribe AI, a production-ready full-stack medical transcription system. Architected a FastAPI backend with OpenAI Whisper for speech-to-text, scispacy (en_ner_bc5cdr_md) for two-pass medical NLP, and Groq's llama-3.3-70b-versatile for SOAP note generation. Designed and implemented a PostgreSQL schema with SQLAlchemy ORM, JWT authentication with bcrypt password hashing, and a multi-container Docker deployment with Nginx reverse proxy. Built the React 19 + TypeScript frontend with Zustand state management, full dark mode, server-backed history with user isolation, and session persistence. Deployed on Railway (backend + PostgreSQL) and Vercel (frontend)."

**Key Metrics:**
- 837 medical terms across 7+ specialties
- 5 entity categories: SYMPTOM, MEDICATION, CONDITION, PROCEDURE, TEST
- SOAP quality: Near Production per physician review
- Technologies: FastAPI, PostgreSQL, SQLAlchemy, JWT, Docker, Nginx, Whisper, scispacy, Groq API, React 19, TypeScript, Zustand, Tailwind CSS v4

---

## 16. README — Current State

Fully rewritten in Week 11 with pipeline diagram, architecture decisions, API reference, testing table, known limitations, updated timeline. Screenshots not yet added — this is the only remaining gap. Do not touch the README until screenshots are taken.

---

## 17. Revised 20-Week Timeline

| Phase | Weeks | Status |
|---|---|---|
| Backend foundation | 1-2 | COMPLETE |
| Original frontend (scrapped) | 6-7 | REPLACED |
| UI/UX prototype design | 8 | COMPLETE |
| React frontend rebuild | 9 | COMPLETE |
| Backend improvements (SOAP + entities) | 9.5 | COMPLETE |
| Frontend testing and bug fixes | 10 | COMPLETE |
| Dark mode + remaining pages + README | 11 | COMPLETE |
| Entity categorisation + colour fix | post-11 | COMPLETE |
| Docker + PostgreSQL + JWT auth | 12 | COMPLETE |
| Testing and QA | 14 | NOT STARTED |
| Alembic migrations | pre-deploy | NOT STARTED |
| Deployment (Railway + Vercel) | 15-16 | NOT STARTED |
| User testing | 17 | NOT STARTED |
| Documentation and demo video | 18-19 | NOT STARTED |
| Final polish and launch | 20 | NOT STARTED |

**Current overall progress: approximately 75% complete**
**On track for May 2026 completion**

---

## 18. Instructions for Future Claude Sessions

### How to Resume Development

1. Read this entire memory file before responding to any request
2. Ask the student to paste relevant file contents before making changes — never assume what is in a file
3. Before writing code, confirm the current state matches what the memory file describes
4. All commits go to the `recent-updates` branch
5. Before any Docker rebuild, run `docker system prune -a -f` first — 32GB storage limit

### Student Skill Level (Updated March 2026)

- Python: Comfortable, can write and debug independently
- React + TypeScript: Intermediate — solved several auth bugs independently this session
- Tailwind CSS v4: Aware of scanner limitations — knows inline styles are required for runtime colours
- Zustand: Understands store pattern, slices, persist middleware
- Docker: Now has hands-on experience — understands layer caching, multi-stage builds, compose
- Git: Basic commands, `recent-updates` branch for all work
- Backend: Understands FastAPI, scispacy pipeline, Groq SOAP generation, SQLAlchemy, JWT

### Student Preferences

- NO EMOJIS in code, UI, comments, or responses — use Lucide icons for UI only
- Prefers detailed explanations with code examples
- Likes to understand WHY, not just HOW
- Professional tone throughout
- Clean, maintainable code
- Will solve bugs independently when given clear direction on root cause

### The 100% Free Constraint

Non-negotiable. Groq free tier (14,400 requests/day). Codespaces (32GB, cannot upgrade), Railway free tier, Vercel free tier.

---

## 19. Critical Reminders

1. **Tailwind is v4, not v3.** `index.css` uses `@import "tailwindcss"` (v4 syntax). `tailwind.config.js` is ignored by v4. Do not add `content:` paths or `safelist:` to tailwind.config.js — it has no effect.
2. **Never return Tailwind class strings for runtime colours.** Use `getEntityColors()` and `getEntityDotColor()` which return hex strings, applied via inline styles. This is the permanent solution.
3. **`getEntityStyles()` has been removed from utils.ts.** If any code references it, it will throw. Use `getEntityColors()` instead.
4. Zustand `partialize` now only persists `preferences`, `notifications`, `sidebarCollapsed`. History and profile are server-side. Do not add history or profile back to partialize.
5. Token storage: `getStoredToken()` / `setStoredToken()` / `clearStoredToken()` in api.ts. Do not use `localStorage.getItem('mediscribe_token')` directly anywhere — always use these helpers.
6. `clearAuth()` removes both `mediscribe_token` AND `mediscribe-storage` from localStorage. This is intentional — it ensures a clean slate for the next user.
7. CORS: `allow_origins=["*"]` with `allow_credentials=True` is invalid. The backend uses an explicit origin list. For Railway deployment, add the Vercel URL via the `CORS_ORIGINS` env var.
8. `load_dotenv()` in main.py MUST come before all local module imports.
9. Groq model is `llama-3.3-70b-versatile` — `llama-3.1-70b-versatile` was decommissioned.
10. SOAP sections from Groq are plain prose strings; fallback sections are structured dicts — `toPlainText()` in HistoryPage and SOAPNoteCard handles both.
11. Dark mode pattern: read `preferences.darkMode`, derive `const dark`, use `cn()` conditionals. Do NOT use Tailwind `dark:` variants.
12. `normalizeTranscriptionResult()` preserves synthetic labels (SYMPTOM, TEST, PROCEDURE). Do not strip or remap these.
13. Dictionary scan entities have `confidence: 0.0` — correct, they are dictionary matches not NER predictions.
14. Docker rebuild storage workflow: `docker compose down` → `docker system prune -a -f` → `docker compose up --build`. Skipping the prune risks hitting 32GB limit.
15. `backend/lib/__init__.py` must exist as an empty file — Python requires it to treat `lib/` as a package for `from lib.utils import ...` to work.
16. The backend `DELETE /api/history` uses ORM-driven deletion (load each record, call `db.delete(record)`) NOT bulk `query(...).delete()`. Bulk delete bypasses SQLAlchemy cascade and will orphan MedicalEntity and SoapNote rows.
17. React version is 19 (not 18 as the old memory file said) — package.json confirms `"react": "^19.2.0"`.
18. `HistoryEntry.id` in the frontend is a string. Database IDs are integers. `mapHistoryEntryFromApi()` converts via `String(entry.id)`. When calling `fetchTranscription()` or `deleteHistoryItem()`, convert back via `Number(entry.id)`.

---

## 20. Tailwind v4 and the Entity Colour System — Full Explanation

### Why the project is on Tailwind v4

`frontend/src/index.css` contains `@import "tailwindcss"` — this is the Tailwind v4 import syntax. Tailwind v3 uses `@tailwind base; @tailwind components; @tailwind utilities;`. The presence of the v4 import means the project is running v4 regardless of what `tailwind.config.js` says. In v4, `tailwind.config.js` is completely ignored. This is also confirmed by `@tailwindcss/vite: ^4.2.0` in devDependencies.

### Why dynamic Tailwind class strings don't work

Tailwind's CSS scanner works at build time by scanning source files for class name strings. It includes a class in the output bundle only if it finds the complete literal string somewhere in the scanned files. When a class name is assembled at runtime — returned from a function, read from an object, or constructed with string interpolation — the scanner never sees it and never generates the CSS.

This was the root cause of the chip colour bug in a previous session. `getEntityStyles()` returned strings like `'bg-red-50'` from a runtime lookup. The scanner never saw those strings as literals.

### Why arbitrary hex values like `bg-[#FEF2F2]` also don't work from functions

Arbitrary values are also only included when found as complete literal strings in scanned files. `bg-[#FEF2F2]` returned from a function at runtime has the same problem.

### The correct permanent solution: inline styles for runtime colours

`style={{ backgroundColor: '#FEF2F2' }}` bypasses the Tailwind scanner entirely. Inline styles are applied directly by the browser.

**Rule for this codebase:** Any colour value that is selected conditionally at runtime (based on entity category, dark mode, or any other runtime variable) MUST be applied as an inline style using a hex value. Static colours hardcoded in className strings (e.g. `bg-[#1E293B]` always used the same way) can remain as Tailwind classes.

---

*Last Updated: March 15, 2026*
*Session: Week 12 — Docker containerisation + PostgreSQL + JWT authentication*
*Changes this session: Dockerfile, Dockerfile.frontend, docker-compose.yml, nginx.conf, .dockerignore, database.py, models.py, schemas.py, auth.py, backend/lib/utils.py, main.py (full rewrite), requirements.txt (new deps), api.ts (full rewrite with JWT interceptors + history API), appStore.ts (auth state + server-backed history), LoginPage.tsx (real auth), App.tsx (session restore), TranscribeButton.tsx (API history refresh), HistoryPage.tsx (backend-backed delete + view/download), SettingsPage.tsx (Clear History + Delete Account), Sidebar.tsx (clearAuth on logout)*
*Next Session: Screenshots for README, then Week 14 — Testing and QA, then Alembic migrations, then Week 15-16 — Railway + Vercel deployment*
*Active Branch: recent-updates*
*System Status: Full stack running in Docker. Auth working with user isolation. History persisted to PostgreSQL. All CRUD operations backend-backed. Ready for QA and deployment phases.*