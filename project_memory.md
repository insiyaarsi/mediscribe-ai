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
- **faster-whisper** — PRIMARY ASR backend (replaced openai-whisper in Week 14). Runs on CPU with int8 compute type. Significantly faster than openai-whisper on CPU without sacrificing meaningful quality.
- openai-whisper — REMOVED from requirements.txt. No longer installed. Do not reference it.
- Python 3.12
- Uvicorn — ASGI server
- python-dotenv — Environment variable management
- scispacy (v0.6.2) — Medical entity extraction
- spaCy — NLP framework
- en_ner_bc5cdr_md (v0.5.4) — Biomedical NLP model. Returns CHEMICAL and DISEASE labels. Dictionary scan second pass adds SYMPTOM, TEST, PROCEDURE, CONDITION, MEDICATION labels (expanded in Week 14).
- SQLAlchemy 2.0.23 — ORM for database operations
- Alembic 1.13.1 — Database migrations (installed, NOT YET USED — tables still created via metadata.create_all. Alembic migrations must be written before Railway deployment.)
- python-jose[cryptography] 3.3.0 — JWT token generation
- passlib[bcrypt] 1.7.4 + bcrypt 4.0.1 — Password hashing
- psycopg2-binary 2.9.9 — PostgreSQL driver
- pydantic[email] — Email validation for auth schemas
- groq Python SDK — Groq SOAP generation via llama-3.3-70b-versatile
- rapidfuzz 3.6.1 — Fuzzy matching utilities

**ASR Configuration (Week 14 — important):**
- Default backend: `faster-whisper`
- Default model: `base.en`
- Default compute type: `int8`
- Configurable via environment variables: `WHISPER_BACKEND`, `WHISPER_MODEL`, `WHISPER_COMPUTE_TYPE`, `WHISPER_BEAM_SIZE`
- Fallback to openai-whisper is coded but the package is NOT installed — do not set WHISPER_BACKEND=openai-whisper in production
- Processing time achieved: under 2 minutes for 3-minute audio, approximately 2 minutes for 8-minute audio

**Database:**
- PostgreSQL 16 (Alpine) — Running as Docker container in development
- Schema: users, transcriptions, medical_entities, soap_notes (ALL COMPLETE)
- Tables created automatically via `models.Base.metadata.create_all(bind=engine)` on startup
- Alembic is installed but migrations are not yet written — create_all handles first boot
- History endpoints now use `selectinload` for eager loading of entities and soap_note relationships — this prevents lazy-load failures during response serialization

**Authentication:**
- JWT (JSON Web Tokens) — COMPLETE and working
- Token stored in sessionStorage by default, localStorage if "Remember me" is checked
- 7-day token expiry
- bcrypt password hashing
- get_current_user() FastAPI dependency used on all protected routes
- setAuth() in appStore.ts NO LONGER writes the token — token writing is handled exclusively by LoginPage.tsx (on login/register) and App.tsx reads it during restore. appStore.ts only manages in-memory auth state.

**Containerisation — COMPLETE and UPDATED Week 14:**
- `Dockerfile` — backend (Python 3.12-slim, ffmpeg, pip install, faster-whisper model pre-download). openai-whisper preload step was REMOVED and replaced with faster-whisper preload.
- `Dockerfile.frontend` — multi-stage: Node 20 builds Vite, Nginx serves static output. VITE_API_URL set to empty string.
- `docker-compose.yml` — three services with corrected dependency wiring: backend depends_on db (healthy), frontend depends_on backend. Previously frontend depended on db which was wrong.
- `nginx.conf` — proxies /api/ to backend, SPA fallback, static asset caching. proxy_read_timeout increased to 600s to handle long transcriptions.
- `.dockerignore` — excludes node_modules, .env, __pycache__, dist, .git

**Deployment (NOT YET STARTED — Week 15-16):**
- Railway — Backend + PostgreSQL
- Vercel — Frontend
- Before deployment: Alembic migrations must be written first

**Development Environment:**
- GitHub Codespaces — 32GB storage (fixed limit on free plan, cannot upgrade)
- Hybrid local dev loop introduced in Week 14 (see Section 11) — DB in Docker, backend and frontend run locally for fast iteration
- Production Docker remains intact for final verification
- Storage management: always run `docker system prune -a -f` BEFORE `docker compose up --build`

**Audio Processing:**
- ffmpeg — Audio file handling
- faster-whisper base.en model — pre-downloaded during Docker build
- Minimum audio duration: 45 seconds (enforced at both frontend and backend)

**Frontend (FULLY REBUILT - Week 9, DARK MODE - Week 11, AUTH - Week 12, QA UPDATES - Week 14):**
- React 19 + TypeScript (.tsx files)
- Vite 7 — Build tool. Pinned to host 0.0.0.0, port 5173, strictPort: true in vite.config.ts
- **Tailwind CSS — CONFIRMED RUNNING v4** (index.css uses `@import "tailwindcss"` — v4 syntax). tailwind.config.js exists but v4 IGNORES it. See Section 21 for full details.
- shadcn/ui — Base component library
- Framer Motion — Animations
- Lucide React — Icons
- Axios — HTTP client with request/response interceptors for JWT. Timeout increased to 600000ms (10 minutes) to handle long transcriptions.
- Zustand 5 — State management (with persist middleware)
- Sonner — Toast notifications
- date-fns — Date formatting
- clsx + tailwind-merge + class-variance-authority — Class utilities

---

### File/Folder Structure

```
mediscribe-ai/
├── .env                          # Environment variables (NOT in Git)
│                                 # Required: GROQ_API_KEY, DATABASE_URL, JWT_SECRET_KEY
│                                 # Optional: CORS_ORIGINS, WHISPER_BACKEND, WHISPER_MODEL
├── .gitignore
├── .dockerignore
├── Dockerfile                    # Backend image — UPDATED Week 14 (faster-whisper preload)
├── Dockerfile.frontend           # Frontend image, multi-stage
├── docker-compose.yml            # UPDATED Week 14 — corrected dependency wiring
├── nginx.conf                    # UPDATED Week 14 — proxy_read_timeout 600s
├── README.md                     # Fully rewritten Week 11. Screenshots partially taken (Dashboard only).
├── scripts/                      # NEW Week 14 — local dev loop scripts
│   ├── dev-db.sh                 # Starts only the Postgres Docker container
│   ├── dev-backend.sh            # Runs FastAPI locally with uvicorn --reload
│   └── dev-frontend.sh           # Runs Vite dev server locally
├── docs/                         # NEW Week 14
│   └── local-dev.md              # Documents the hybrid local dev workflow
└── backend/
│   ├── main.py                  # UPDATED Week 14 — transcript normalisation step, short-audio header guard, selectinload for history endpoints, validation reason passed through correctly
│   ├── database.py              # SQLAlchemy engine + get_db() dependency
│   ├── models.py                # ORM models: User, Transcription, MedicalEntity, SoapNote
│   ├── schemas.py               # Pydantic request/response schemas
│   ├── auth.py                  # Password hashing, JWT create/verify, get_current_user
│   ├── clinical_extraction.py   # NEW Week 14 — structured clinical data extraction for SOAP generation. Extracts patient demographics, ICE, clinician identity, history gaps, diabetes care pathway items, generic PMH/social/medication gaps.
│   ├── lib/
│   │   ├── __init__.py          # Empty — makes lib/ a Python package
│   │   └── utils.py             # generate_patient_id(), estimate_duration()
│   ├── transcription.py         # REWRITTEN Week 14 — faster-whisper primary, openai-whisper fallback (not installed). Env-configurable.
│   ├── entity_extraction.py     # UPDATED Week 14 — dictionary fallback now scans CONDITION and MEDICATION in addition to SYMPTOM, TEST, PROCEDURE. Fixes entity count inconsistency.
│   ├── medical_categories.py    # Medical term dictionaries (837 terms)
│   ├── medical_categories_backup.py
│   ├── soap_generator.py        # HEAVILY UPDATED Week 14 — see Section 8 for full details
│   ├── content_validator.py     # UPDATED Week 14 — conversational dialogue support, short-transcript logic, word count threshold, audio duration guard
│   ├── spell_correction.py      # ACTIVATED Week 14 — now part of live pipeline (STEP 1B in main.py). Phrase normalization for ASR drift patterns. Word-level medical correction.
│   └── requirements.txt         # UPDATED Week 14 — added faster-whisper, removed openai-whisper
└── frontend/
    ├── package.json
    ├── vite.config.ts            # UPDATED Week 14 — pinned host, port, strictPort
    ├── tsconfig.json
    ├── tsconfig.app.json
    ├── tailwind.config.js        # EXISTS but ignored by Tailwind v4
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── App.tsx              # UPDATED Week 14 — isAuthenticated removed from restore effect deps, session restore no longer cancels its own history fetch
        ├── main.tsx             # Entry point with Toaster
        ├── index.css            # Global styles — uses @import "tailwindcss" (v4)
        ├── types/
        │   └── index.ts         # All TypeScript interfaces
        ├── lib/
        │   └── utils.ts         # getEntityColors, getEntityDotColor, cn, etc.
        ├── services/
        │   └── api.ts           # UPDATED Week 14 — Axios timeout 600000ms, X-Audio-Duration-Seconds header, VITE_API_URL empty string handling fixed
        ├── store/
        │   └── appStore.ts      # UPDATED Week 14 — setAuth() no longer writes token (token writing is LoginPage/App.tsx only), clearAuth() uses clearStoredToken() helper
        └── components/
            ├── layout/
            │   ├── Sidebar.tsx
            │   └── TopBar.tsx
            └── features/
                ├── upload/
                │   ├── StatsBar.tsx
                │   ├── UploadZone.tsx        # UPDATED Week 14 — blob URL lifecycle fix, TypeScript DragEvent/ChangeEvent import fix
                │   ├── UploadCard.tsx
                │   └── TranscribeButton.tsx  # UPDATED Week 14 — audio duration detection, MIN_AUDIO_DURATION_SECONDS=45, realistic ETA/countdown UI, X-Audio-Duration-Seconds header, blob URL cleanup
                └── results/
                    ├── ResultsPanel.tsx
                    ├── TranscriptionCard.tsx
                    ├── EntitiesCard.tsx
                    ├── EntityChip.tsx
                    └── SOAPNoteCard.tsx
        └── pages/
            ├── LoginPage.tsx    # token written here via setStoredToken() before calling setAuth(user) — setAuth no longer takes token argument
            ├── DashboardPage.tsx
            ├── HistoryPage.tsx
            └── SettingsPage.tsx
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

### Zustand Store (`src/store/appStore.ts`) — UPDATED Week 14

Persisted to localStorage via `zustand/middleware/persist`. Key: `mediscribe-storage`.

**Persisted slices:**
- `preferences` — Preferences (autoScroll, compactView, showConfidence, autoCopy, darkMode)
- `notifications` — NotificationSettings (emailNotifs, transcriptDone, weeklyReport)
- `sidebarCollapsed` — boolean

**Intentionally NOT persisted (server is source of truth):**
- `history` — loaded from API on login
- `profile` — populated from JWT login response
- `uploadState`, `selectedFile`, `transcriptionResult`, `processingStatus`, `errorMessage`
- `currentPage` — resets to `login` on reload
- `isAuthenticated`, `authUser`

**Critical auth change from Week 14:**
- `setAuth(user)` now takes only ONE argument — the user object. It no longer accepts or writes a token.
- Token writing happens in LoginPage.tsx via `setStoredToken(token, remember)` before `setAuth(user)` is called
- Session restore in App.tsx also calls `setAuth(user)` with one argument after reading the stored token
- Any code calling `setAuth(user, token)` with two arguments will cause a TypeScript error

**Actions:**
- `setPage(page)`, `toggleSidebar()`
- `setAuth(user)` — updates in-memory auth state and profile only. Does NOT write token.
- `clearAuth()` — calls `clearStoredToken()` (clears both sessionStorage and localStorage), resets all user state, navigates to login. Does NOT clear `mediscribe-storage` (UI preferences survive logout intentionally).
- `setFile(file)`, `setUploadState(state)`, `setProcessingStatus(msg)`, `setResult(result)`, `setError(msg)`, `clearUpload()`
- `addToHistory(result, file)` — fallback only, used when API history refresh fails
- `setHistory(entries)` — replaces history array from API data
- `deleteHistoryItem(id)`, `clearHistory()`
- `updateProfile(partial)`, `updatePreferences(partial)`, `updateNotifications(partial)`
- `resetSettings()` — restores preferences and notifications to defaults only

### Token Storage Pattern (api.ts)

```typescript
const TOKEN_KEY = 'mediscribe_token'

getStoredToken()              // reads sessionStorage first, then localStorage
setStoredToken(token, remember?)  // remember=true → localStorage, false → sessionStorage
                              // if remember omitted, preserves existing storage mode
clearStoredToken()            // clears both sessionStorage and localStorage
```

### Session Restore (App.tsx) — FIXED Week 14

Critical fix: `isAuthenticated` was removed from the restore useEffect dependency array. Previously the effect re-ran when setAuth() changed isAuthenticated, which caused the cleanup function to cancel the in-flight fetchHistory() call, leaving history empty until the next upload.

Current behavior:
1. Effect runs once on mount, driven by token presence only
2. Calls `getStoredToken()` — checks sessionStorage then localStorage
3. If token found, calls `GET /api/auth/me`
4. On success: calls `setAuth(user)`, navigates to dashboard, then fetches history as best-effort (auth restore does not depend on history fetch succeeding)
5. On failure: calls `clearAuth()`
6. `isRestoringSession` gate prevents login page flash during restore

### API Service (`src/services/api.ts`) — UPDATED Week 14

Base URL logic (fixed in Week 14):
- If `VITE_API_URL` is undefined (local non-Docker): use `http://localhost:8000`
- If `VITE_API_URL` is empty string (Docker/Nginx): use same-origin requests (`/api/...`)
- If `VITE_API_URL` is non-empty string: use that exact value

Axios timeout: 600000ms (10 minutes) — increased from 120000ms to handle long transcriptions.

`transcribeAudio()` now sends `X-Audio-Duration-Seconds` header with the measured audio duration.

---

## 5. Pages — Current State

### LoginPage
- Calls `setStoredToken(response.access_token, remember)` BEFORE calling `setAuth(response.user)` — token must be written first
- Then fetches history and navigates to dashboard

### App.tsx
- Session restore effect depends only on token presence, not isAuthenticated
- Calls `setAuth(user)` with one argument

### DashboardPage
- Thin wrapper. No changes Week 14.

### HistoryPage
- All delete operations call backend before updating local state
- handleView/handleDownload fetch full record from API if result is undefined
- toPlainText() handles both string and dict SOAP sections

### SettingsPage
- Clear History and Delete Account both backed by API calls

### Sidebar
- Logout calls clearAuth()
- Toast: "Sign Out Successfull" (double-l — intentional, matches what was shipped)

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

Sub-components receive `dark: boolean` as an explicit prop.

**Do NOT use Tailwind `dark:` variants.**
**Do NOT return Tailwind class strings for colours from runtime functions.**

---

## 7. Backend — Current State

### Pipeline Order in main.py (POST /api/transcribe)

```
STEP 1:   Transcription (faster-whisper)
STEP 1B:  Transcript Normalisation (spell_correction.py — ACTIVE since Week 14)
STEP 2:   Content Validation (content_validator.py)
STEP 3:   Entity Extraction (entity_extraction.py)
STEP 4:   SOAP Note Generation (soap_generator.py + clinical_extraction.py)
STEP 5:   Persist to Database
```

Pre-pipeline: Short audio guard — if `X-Audio-Duration-Seconds` header is present and < 45, return rejection before running any pipeline step.

### Database Models (models.py)

```python
User             — id, email, hashed_password, first_name, last_name, specialty, hospital, license_no, is_active, created_at
Transcription    — id, user_id (FK), patient_id, filename, transcription, confidence_score (0-100), duration, status, created_at
MedicalEntity    — id, transcription_id (FK), text, label, confidence, start, end
SoapNote         — id, transcription_id (FK, unique), subjective, objective, assessment, plan, source, created_at
```

Cascade: deleting a User cascades to Transcription, then to MedicalEntity and SoapNote.

History endpoints use `selectinload` for eager loading:
```python
.options(selectinload(models.Transcription.entities), selectinload(models.Transcription.soap_note))
```
This is required — do not remove it. Lazy loading during response serialization causes inconsistent results.

### API Endpoints (main.py)

**Auth:**
- `POST /api/auth/register` — creates user, returns token + user
- `POST /api/auth/login` — verifies credentials, returns token + user
- `GET /api/auth/me` — returns current user profile (protected)
- `DELETE /api/auth/me` — deletes account + all data via ORM cascade (protected)

**History:**
- `GET /api/history` — returns all transcriptions for current user, newest first, with eager-loaded entities and soap_note (protected)
- `GET /api/history/{id}` — returns single transcription with entities + SOAP note, eager-loaded (protected)
- `DELETE /api/history/{id}` — deletes single transcription (protected, 403 if wrong user)
- `DELETE /api/history` — ORM-driven deletion of all user transcriptions (protected)

**Transcription:**
- `POST /api/transcribe` — full pipeline, accepts `X-Audio-Duration-Seconds` header (protected)

**Other:**
- `GET /` — root info
- `GET /health` — health check
- `POST /api/download` — returns SOAP note as downloadable .txt (unprotected)

### Content Validator (content_validator.py) — UPDATED Week 14

Key changes:
- Added text normalization before matching (lowercase, punctuation stripping, whitespace collapsing)
- Added greedy multi-word phrase matching for density calculation (catches "chest pain", "heart attack" as units)
- Added conversational history-taking markers to CLINICAL_MARKERS (e.g. "what's brought you in", "on a scale of", "check your name and date of birth")
- Added length-based density scaling for longer transcripts (dialogue dilution compensation, capped at 1.5x)
- Added minimum word count threshold — short transcripts with clinical signal return "Recording is too short" reason, not "non-medical"
- Added `word_count` and `minimum_word_count` to validation details
- Density threshold lowered from 10% to 8%
- Validation failure reason now flows through to API response correctly (was previously hardcoded)

### Entity Extraction (entity_extraction.py) — UPDATED Week 14

Dictionary fallback scan now covers ALL five categories:
- SYMPTOM, CONDITION, MEDICATION, TEST, PROCEDURE

Previously only SYMPTOM, TEST, PROCEDURE were covered by the fallback. This meant NER misses for CONDITION and MEDICATION were not recovered, causing entity count inconsistency across runs of the same audio. This is now fixed.

### Spell Correction (spell_correction.py) — ACTIVATED Week 14

Previously built but not used. Now integrated as STEP 1B in the live pipeline.

Contains:
- `PHRASE_NORMALIZATIONS` — dict of ASR drift patterns to corrected phrases
- `normalize_consultation_phrases(text)` — applies phrase replacements
- `correct_medical_spelling(text)` — applies phrase normalization then word-level correction
- Returns structured log of replacements made

Phrase examples:
- `"50th medical student"` → `"fifth year medical student"`
- `"whole chest pain"` → `"chest pain"`
- `"breathless nurse"` → `"breathlessness"`

### SOAP Generator (soap_generator.py) — HEAVILY UPDATED Week 14

Key additions:
- Shared placeholder for unsupported sections: `"Not enough information in the recording to complete this section."`
- `_normalize_soap_sections()` — converts empty/missing sections to placeholder
- `_apply_clinical_consistency_rules()` — post-generation rules layer for pericarditis pattern (acute chest pain with pleuritic character, worse lying down, following viral illness, young patient). Rules fire only when pericarditis is the leading diagnosis — they do not affect other encounter types.
- Prompt instructs model not to default to ACS for chest pain — pericarditis differential must be considered when pattern matches
- Required ICE (ideas, concerns, expectations) capture
- Required explicit "not elicited" phrasing for missing history components
- Safer Plan behavior: safety-netting, rest/exercise avoidance, follow-up timing, gastroprotection with NSAIDs
- Pericarditis plan uses direct management language, not conditional ("if confirmed...") language
- `_validate_section_quality()` — expanded validation with penalties for missing education detail, referrals, clinician context, history gaps, diabetes type context
- Counselling encounter handling — improved for chronic disease (diabetes) visits

### Clinical Extraction (clinical_extraction.py) — NEW Week 14

New module that produces a structured clinical representation from the transcript before SOAP generation. Used to enrich and ground the SOAP output.

Extracts:
- Patient demographics (name, DOB, age — parsed from multiple spoken date formats)
- Clinician identity (name, role — heuristic extraction from introduction phrases)
- ICE (ideas, concerns, expectations)
- History gaps (PMH, surgical history, medications, allergies, social history, family history)
- Encounter-specific prompts (e.g. forward-leaning relief not explored for chest pain)
- Diabetes care pathway items (HbA1c, retinal screening, foot exam, DESMOND, dietetic referral, DSN input)
- Education/teach-back signals for counselling encounters

Post-processing merges heuristic extraction data into the structured representation even when LLM extraction is sparse.

Note: `runtime_context.py` was added then removed in Week 14. It is NOT in the codebase. Do not reference it.

---

## 8. SOAP Quality Baselines (Week 14 QA Results)

These are the established quality benchmarks from physician review:

| Test Case | Audio Type | Duration | Score | Notes |
|---|---|---|---|---|
| Chest pain consultation | Two-speaker dialogue | 3 minutes | 9.6/10 | Doctor approved. Acute presentation. |
| Diabetes counselling | Two-speaker dialogue | 8 minutes | 8.1/10 | Counselling plan hardest to optimise. Chronic disease visits are inherently harder to document than acute. |
| Degraded quality (8kHz/32kbps) | Chest pain, poor audio | 3 minutes | 7.2/10 | Graceful degradation. No crashes. Entity count stable. |

Known SOAP limitation: counselling and chronic disease encounter plans score lower because they depend on education-specific and referral-specific transcript content that varies widely. This is an architectural limitation, not a bug. Document it honestly.

SOAP sections for history-only recordings use the placeholder "Not enough information in the recording to complete this section." for O, A, P when clinical evidence is absent. This is intentional and safe — do not modify this behavior.

---

## 9. Docker Setup — UPDATED Week 14

### docker-compose.yml services (corrected dependency order)

```
db        — postgres:16-alpine, port 5432, health check pg_isready
backend   — python:3.12-slim, port 8000, depends_on db (healthy), health check GET /health
frontend  — nginx:stable-alpine, port 80, depends_on backend (not db — this was the bug)
```

### Dockerfile highlights (updated)

- Backend: pip install layer before COPY source — exploits layer cache
- Backend: faster-whisper model pre-downloaded at build time:
  `RUN python -c "from faster_whisper import WhisperModel; WhisperModel('base.en', device='cpu', compute_type='int8')"`
- The old `import whisper; whisper.load_model('base')` line has been REMOVED. Do not add it back.
- Frontend: VITE_API_URL set to empty string

### nginx.conf highlights (updated)

- `proxy_read_timeout 600s` — increased from 180s to handle long transcriptions
- `/api/` proxied to backend:8000
- SPA fallback for all other routes

### Environment variables required in .env

```
GROQ_API_KEY=<your key>
DATABASE_URL=postgresql://mediscribe:mediscribe_dev_password@db:5432/mediscribe
JWT_SECRET_KEY=<generate: python -c "import secrets; print(secrets.token_hex(32))">
CORS_ORIGINS=<optional, defaults to localhost variants>
WHISPER_BACKEND=faster-whisper   # optional, this is the default
WHISPER_MODEL=base.en             # optional, this is the default
WHISPER_COMPUTE_TYPE=int8         # optional, this is the default
```

### Storage management (CRITICAL for Codespaces)

32GB limit, cannot be upgraded. Always:

```bash
docker compose down
docker system prune -a -f
docker compose up --build
```

### Docker smoke test sequence (post-rebuild verification)

```bash
docker compose ps                              # all three services should show healthy/running
docker compose logs backend --tail=20          # check for startup errors
curl -f http://localhost:8000/health           # backend health (primary truth)
curl -I http://localhost                       # frontend serving (should return 200)
```

Note: `curl -f http://localhost/api/health` may return 404 — this is not a backend failure if `/health` is healthy. The `/api/health` proxied path is only valid if explicitly wired in nginx.

---

## 10. Local Dev Loop — NEW Week 14

Introduced to avoid 10-minute Docker rebuilds during active iteration. Production Docker remains intact.

**Architecture:**
- DB: Docker only (`docker compose up -d db`)
- Backend: local (`uvicorn --reload`)
- Frontend: local (`npm run dev`)

**Scripts:**

Terminal 1:
```bash
./scripts/dev-db.sh
```

Terminal 2:
```bash
./scripts/dev-backend.sh
```

Terminal 3:
```bash
./scripts/dev-frontend.sh
```

**One-time setup required:**
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cd frontend && npm ci
```

**Local URLs:**
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Database: `localhost:5432`

**Important:** `dev-backend.sh` overrides `DATABASE_URL` to use `localhost:5432` instead of the Docker hostname `db`. The `.env` file uses `db` as the hostname — do not change `.env`, the script handles this.

**When to use local dev vs Docker:**
- Local dev: for all active development, code changes, prompt tuning, debugging
- Docker: for final verification before committing or deploying. Always do one Docker smoke test before marking a feature complete.

---

## 11. Known Limitations and Remaining TODOs

- Screenshots for README — Dashboard screenshot taken. Still need: History page with entries, result panel with entities and SOAP note, Settings page, Login page.
- SOAP note edits are local React state only — not persisted to DB
- Profile photo stored as null — no avatar upload
- Negation detection not implemented ("denies chest pain" still extracts "chest pain")
- Alembic migrations not written — MUST be done before Railway deployment
- Password reset — UI shows toast "coming in a future update", not scheduled
- Google SSO — UI shows toast "coming in a future update", not scheduled
- Counselling encounter SOAP plans score lower than acute presentations — known architectural limitation, document honestly

---

## 12. Development Commands

```bash
# Full Docker rebuild (production-style, use for final verification)
docker compose down
docker system prune -a -f
docker compose up --build

# Local dev loop (use for active development)
./scripts/dev-db.sh        # Terminal 1
./scripts/dev-backend.sh   # Terminal 2
./scripts/dev-frontend.sh  # Terminal 3

# Git
git add . && git commit -m "description" && git push origin recent-updates
```

---

## 13. Progress Snapshot — As of April 2026

### Completed

**Weeks 1-2:** Backend foundation
**Week 8:** UI/UX prototype design
**Week 9:** React 19 + TypeScript frontend rebuild
**Week 9.5:** Backend improvements — Groq SOAP generation, physician review cycles
**Week 10:** Frontend testing
**Week 11:** Dark mode, README rewritten
**Post-Week 11:** Entity chip colour fix (Tailwind v4 inline styles)
**Week 12:** Docker, PostgreSQL, JWT auth, user-scoped history, all CRUD backend-backed
**Week 14 (COMPLETE):** Full QA run — 12 tests, all passing. Major pipeline improvements:
- faster-whisper replaces openai-whisper
- spell_correction.py activated in live pipeline
- clinical_extraction.py added for structured SOAP grounding
- entity fallback expanded to all 5 categories
- SOAP clinical consistency rules layer added
- content_validator updated for conversational dialogue
- 45-second minimum audio duration enforced
- local dev loop introduced
- Docker dependency wiring corrected
- Dockerfile updated for faster-whisper
- session restore race condition fixed in App.tsx
- setAuth() decoupled from token writing
- clearAuth() uses clearStoredToken() helper

### Not Yet Started
- Remaining README screenshots
- Alembic migrations (MUST happen before Railway deployment)
- Deployment to Railway + Vercel (Weeks 15-16)
- User testing (Week 17)
- Documentation and demo video (Weeks 18-19)
- Final polish and launch (Week 20)

---

## 14. Next Steps — Priority Order for Week 15-16

**1. Remaining README screenshots**
Take before any deployment work:
- History page with entries visible
- Result panel showing entities and SOAP note
- Settings page
- Login page

**2. Alembic migrations (before any Railway deployment)**

```bash
cd backend
alembic init alembic
```

Edit `alembic/env.py` to import your models and use the DATABASE_URL from environment. Then:

```bash
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

Test the migration applies cleanly on a fresh database before touching Railway. This replaces the `create_all` approach for production. Railway will run migrations on deploy — `create_all` is not safe for production because it cannot handle schema changes.

**3. Railway deployment (backend + PostgreSQL)**
- Create a new Railway project
- Add PostgreSQL plugin — Railway injects DATABASE_URL automatically
- Set environment variables: GROQ_API_KEY, JWT_SECRET_KEY, CORS_ORIGINS (set to Vercel URL once known)
- Deploy backend from `recent-updates` branch
- Confirm health check at `https://<railway-url>/health`
- Run one transcription test against the Railway backend

**4. Vercel deployment (frontend)**
- Connect Vercel to the GitHub repo, `recent-updates` branch
- Set `VITE_API_URL` to the Railway backend URL (e.g. `https://mediscribe-backend.railway.app`)
- Deploy
- Confirm the full auth flow works end-to-end against the deployed backend

**5. CORS update for production**
Once Railway and Vercel URLs are known, set `CORS_ORIGINS` on Railway to include the Vercel frontend URL. Without this, authenticated requests from the deployed frontend will be blocked.

---

## 15. Backend Remaining Improvement Backlog

**SOAP note edit persistence:** `PATCH /api/soap/{id}` endpoint — medium priority, do after deployment.
**Complaint-based smart templates:** Detect chief complaint, inject complaint-specific checklist into SOAP prompt. Low priority.
**Negation detection:** "denies chest pain" currently still extracts "chest pain". Low priority.

---

## 16. Resume / Portfolio Notes

"Built MediScribe AI, a production-ready full-stack medical transcription system. Architected a FastAPI backend with faster-whisper for real-time speech-to-text, scispacy (en_ner_bc5cdr_md) for two-pass medical NLP entity extraction, and Groq's llama-3.3-70b-versatile for SOAP note generation with a post-generation clinical consistency rules layer. Designed and implemented a PostgreSQL schema with SQLAlchemy ORM, JWT authentication with bcrypt password hashing, and a multi-container Docker deployment with Nginx reverse proxy. Built the React 19 + TypeScript frontend with Zustand state management, full dark mode, server-backed history with user isolation, and session persistence. SOAP notes achieved 9.6/10 in physician review for acute presentations. Deployed on Railway (backend + PostgreSQL) and Vercel (frontend)."

**Key Metrics:**
- 837 medical terms across 7+ specialties
- 5 entity categories: SYMPTOM, MEDICATION, CONDITION, PROCEDURE, TEST
- SOAP quality: 9.6/10 acute, 8.1/10 chronic disease counselling (physician reviewed)
- Processing time: under 2 minutes for 3-minute audio, approximately 2 minutes for 8-minute audio
- Technologies: FastAPI, PostgreSQL, SQLAlchemy, JWT, Docker, Nginx, faster-whisper, scispacy, Groq API, React 19, TypeScript, Zustand, Tailwind CSS v4

---

## 17. README — Current State

Fully rewritten in Week 11 with pipeline diagram, architecture decisions, API reference, testing table, known limitations, updated timeline. Screenshots partially taken — Dashboard only. Remaining screenshots needed before README is complete. Do not touch README content until all screenshots are taken and inserted.

---

## 18. Revised 20-Week Timeline

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
| Testing and QA | 14 | COMPLETE |
| Alembic migrations | pre-deploy | NOT STARTED |
| Deployment (Railway + Vercel) | 15-16 | NOT STARTED |
| User testing | 17 | NOT STARTED |
| Documentation and demo video | 18-19 | NOT STARTED |
| Final polish and launch | 20 | NOT STARTED |

**Current overall progress: approximately 80% complete**
**On track for May 2026 completion**

---

## 19. Instructions for Future Claude Sessions

### How to Resume Development

1. Read this entire memory file before responding to any request
2. Ask the student to paste relevant file contents before making changes — never assume what is in a file
3. Before writing code, confirm the current state matches what the memory file describes
4. All commits go to the `recent-updates` branch
5. Before any Docker rebuild, run `docker system prune -a -f` first — 32GB storage limit
6. For active development, use the local dev loop (Section 10) not Docker rebuilds
7. Always do a Docker smoke test before marking a feature complete

### Student Skill Level (Updated April 2026)

- Python: Comfortable, debugs independently, wrote most Week 14 backend changes independently
- React + TypeScript: Intermediate-Advanced — solved auth bugs, session restore race, TypeScript type issues independently
- Tailwind CSS v4: Aware of scanner limitations — knows inline styles are required for runtime colours
- Zustand: Understands store pattern, slices, persist middleware, decoupling concerns
- Docker: Competent — understands layer caching, multi-stage builds, compose, dependency wiring
- Git: Basic commands, `recent-updates` branch for all work
- Backend: Strong — FastAPI, scispacy pipeline, Groq SOAP generation, SQLAlchemy, JWT, ASR backends

### Student Preferences

- NO EMOJIS in code, UI, comments, or responses — use Lucide icons for UI only
- Prefers detailed explanations with code examples
- Likes to understand WHY, not just HOW
- Professional tone throughout
- Clean, maintainable code
- Will solve bugs independently when given clear direction on root cause
- Provides developer handoff summaries after completing work independently — always read these before proceeding

### The 100% Free Constraint

Non-negotiable. Groq free tier (14,400 requests/day). Codespaces (32GB, cannot upgrade). Railway free tier. Vercel free tier.

---

## 20. Critical Reminders

1. **Tailwind is v4, not v3.** `index.css` uses `@import "tailwindcss"` (v4 syntax). `tailwind.config.js` is ignored by v4. Do not add `content:` paths or `safelist:` to tailwind.config.js — it has no effect.
2. **Never return Tailwind class strings for runtime colours.** Use `getEntityColors()` and `getEntityDotColor()` which return hex strings, applied via inline styles. This is the permanent solution.
3. **`getEntityStyles()` has been removed from utils.ts.** If any code references it, it will throw. Use `getEntityColors()` instead.
4. Zustand `partialize` only persists `preferences`, `notifications`, `sidebarCollapsed`. Do not add history or profile back.
5. Token storage: `getStoredToken()` / `setStoredToken()` / `clearStoredToken()` in api.ts. Never access localStorage directly for the token anywhere.
6. `clearAuth()` uses `clearStoredToken()` which clears both sessionStorage and localStorage. It does NOT clear `mediscribe-storage` — UI preferences survive logout intentionally.
7. CORS: `allow_origins=["*"]` with `allow_credentials=True` is invalid. Backend uses explicit origin list. For Railway deployment, add the Vercel URL via the `CORS_ORIGINS` env var.
8. `load_dotenv()` in main.py MUST come before all local module imports.
9. Groq model is `llama-3.3-70b-versatile` — `llama-3.1-70b-versatile` was decommissioned.
10. SOAP sections from Groq are plain prose strings; fallback sections are structured dicts — `toPlainText()` in HistoryPage and SOAPNoteCard handles both.
11. Dark mode pattern: read `preferences.darkMode`, derive `const dark`, use `cn()` conditionals. Do NOT use Tailwind `dark:` variants.
12. `normalizeTranscriptionResult()` preserves synthetic labels (SYMPTOM, TEST, PROCEDURE). Do not strip or remap these.
13. Dictionary scan entities have `confidence: 0.0` — correct, they are dictionary matches not NER predictions.
14. Docker rebuild storage workflow: `docker compose down` → `docker system prune -a -f` → `docker compose up --build`. Skipping the prune risks hitting 32GB limit.
15. `backend/lib/__init__.py` must exist as an empty file — Python requires it to treat `lib/` as a package.
16. The backend `DELETE /api/history` uses ORM-driven deletion (load each record, call `db.delete(record)`) NOT bulk `query(...).delete()`. Bulk delete bypasses SQLAlchemy cascade and orphans child rows.
17. React version is 19 — package.json confirms `"react": "^19.2.0"`.
18. `HistoryEntry.id` in the frontend is a string. Database IDs are integers. Convert with `Number(entry.id)` when calling API functions.
19. **openai-whisper is NOT installed.** The production ASR backend is faster-whisper. Do not add openai-whisper back to requirements.txt. Do not add `import whisper; whisper.load_model(...)` to the Dockerfile.
20. **setAuth() takes ONE argument (user only).** It no longer accepts or writes a token. Token writing is handled in LoginPage.tsx and read-only in App.tsx. Any two-argument setAuth call is a bug.
21. **History endpoints use selectinload for entities and soap_note.** Do not remove this — lazy loading during response serialization causes inconsistent API responses.
22. **Minimum audio duration is 45 seconds.** Enforced at both frontend (TranscribeButton.tsx, MIN_AUDIO_DURATION_SECONDS constant) and backend (X-Audio-Duration-Seconds header check in main.py). Short audio returns "Recording is too short to process" not "Non-medical content detected."
23. **The session restore useEffect in App.tsx must NOT include isAuthenticated in its dependency array.** Including it causes the effect to re-run when setAuth() changes auth state, which cancels its own in-flight fetchHistory() call via cleanup, leaving history empty.
24. **`runtime_context.py` does not exist.** It was added and removed during Week 14 QA. Do not reference it.
25. `VITE_API_URL` empty string means same-origin requests (Docker/Nginx mode). Undefined means use `http://localhost:8000` (local non-Docker). The API base URL logic in api.ts handles both cases explicitly.

---

## 21. Tailwind v4 and the Entity Colour System — Full Explanation

### Why the project is on Tailwind v4

`frontend/src/index.css` contains `@import "tailwindcss"` — this is the Tailwind v4 import syntax. Tailwind v3 uses `@tailwind base; @tailwind components; @tailwind utilities;`. The presence of the v4 import means the project is running v4 regardless of what `tailwind.config.js` says. In v4, `tailwind.config.js` is completely ignored. This is also confirmed by `@tailwindcss/vite: ^4.2.0` in devDependencies.

### Why dynamic Tailwind class strings don't work

Tailwind's CSS scanner works at build time by scanning source files for class name strings. It includes a class in the output bundle only if it finds the complete literal string somewhere in the scanned files. When a class name is assembled at runtime — returned from a function, read from an object, or constructed with string interpolation — the scanner never sees it and never generates the CSS.

### Why arbitrary hex values like `bg-[#FEF2F2]` also don't work from functions

Arbitrary values are also only included when found as complete literal strings in scanned files.

### The correct permanent solution: inline styles for runtime colours

`style={{ backgroundColor: '#FEF2F2' }}` bypasses the Tailwind scanner entirely.

**Rule for this codebase:** Any colour value selected conditionally at runtime MUST be applied as an inline style using a hex value. Static colours hardcoded in className strings can remain as Tailwind classes.

---

*Last Updated: April 2nd 2026*
*Session: Week 14 — Full Testing and QA + major pipeline improvements*
*Changes this session: transcription.py (faster-whisper), content_validator.py (dialogue support, short-audio), entity_extraction.py (expanded fallback), soap_generator.py (consistency rules, ICE, partial content handling), clinical_extraction.py (NEW), spell_correction.py (activated), main.py (pipeline steps 1B + pre-pipeline audio guard + selectinload + validation reason passthrough), requirements.txt (faster-whisper added, openai-whisper removed), Dockerfile (faster-whisper preload), docker-compose.yml (corrected dependency wiring), nginx.conf (timeout 600s), api.ts (timeout 600000ms, X-Audio-Duration-Seconds, VITE_API_URL fix), appStore.ts (setAuth one-argument, clearAuth uses clearStoredToken), App.tsx (restore race fix), LoginPage.tsx (token written before setAuth), TranscribeButton.tsx (audio duration check, ETA countdown, blob URL cleanup), UploadZone.tsx (blob URL cleanup, TypeScript fix), vite.config.ts (pinned port), scripts/dev-db.sh, scripts/dev-backend.sh, scripts/dev-frontend.sh, docs/local-dev.md*
*Next Session: README screenshots → Alembic migrations → Railway deployment → Vercel deployment*
*Active Branch: recent-updates*
*System Status: Full stack QA complete. All 12 QA tests passing. Docker smoke test passing. SOAP quality 9.6/10 acute, 8.1/10 counselling. Processing time under 2 minutes. Ready for Alembic migrations and deployment.*