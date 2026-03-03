# MediScribe AI - Project Memory File

---

## 1. Project Summary

**Project Name:** MediScribe AI

**Description:** A production-ready medical transcription system that converts doctor-patient conversations into structured clinical documentation. Uses speech-to-text AI to transcribe audio, extracts medical entities (symptoms, medications, diagnoses), generates formatted SOAP notes, and provides secure multi-user access with database persistence. Reduces physician documentation time from 8 minutes to 3 minutes per patient.

**Primary Goals:**
- Build a complete portfolio project for Canadian university applications (McGill, Concordia, Windsor, Carleton) AND job applications
- Demonstrate advanced AI/ML skills with real-world healthcare application
- Create a fully functional, deployed demo accessible via public URL
- Demonstrate production engineering skills (Docker, PostgreSQL, authentication, deployment)
- Keep the entire project 100% FREE (no paid APIs or services) — SOAP generation uses Groq free tier (llama-3.3-70b-versatile), all other infrastructure is free
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
- en_ner_bc5cdr_md (v0.5.4) — Current biomedical NLP model (UPGRADED from en_core_sci_sm in Week 9.5). Returns CHEMICAL and DISEASE labels.
- SQLAlchemy — ORM for database operations (planned Week 12)
- Alembic — Database migrations (planned Week 12)
- python-jose — JWT token generation (planned Week 11)
- passlib + bcrypt — Password hashing (planned Week 11)
- groq Python SDK — For Groq SOAP generation via llama-3.3-70b-versatile (IMPLEMENTED in Week 9.5)

**Database:**
- PostgreSQL — Primary database for persistence (planned Week 12)
- Schema: users, transcriptions, medical_entities, soap_notes

**Authentication:**
- JWT (JSON Web Tokens) — Stateless authentication (planned Week 11)
- bcrypt — Secure password hashing
- Role-based access control

**Containerization:**
- Docker — Application containerisation (planned Week 13)
- docker-compose — Multi-container orchestration

**Deployment:**
- Railway — Backend + database hosting (free tier)
- Vercel — Frontend hosting (free tier)

**Development Environment:**
- GitHub Codespaces (~15GB storage available)
- VS Code in browser
- No local machine resources used

**Audio Processing:**
- ffmpeg — Audio file handling
- Whisper base model (140MB, downloaded once)

**Frontend (FULLY REBUILT - Week 9):**
- React 18 + TypeScript (.tsx files)
- Vite 7 — Build tool
- Tailwind CSS v3 (NOT v4 — shadcn compatibility requires v3)
- shadcn/ui — Base component library
- Framer Motion — Animations
- Lucide React — Icons
- Axios — HTTP client
- Zustand — State management (with persist middleware)
- Sonner — Toast notifications
- date-fns — Date formatting
- clsx + tailwind-merge + class-variance-authority — Class utilities

---

### File/Folder Structure

```
mediscribe-ai/
├── .env                          # Environment variables (NOT in Git)
├── .gitignore
├── README.md
├── backend/
│   ├── main.py                  # Main API server
│   ├── transcription.py         # Whisper transcription
│   ├── entity_extraction.py     # Medical entity extraction (upgraded model)
│   ├── medical_categories.py    # Medical term dictionaries (837 terms)
│   ├── medical_categories_backup.py
│   ├── soap_generator.py        # SOAP note generation (Groq-powered, IMPROVED)
│   ├── content_validator.py     # Medical content validation
│   ├── spell_correction.py      # DISABLED — built but not used
│   └── requirements.txt
└── frontend/                    # FULLY REBUILT in Week 9
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tsconfig.app.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── App.tsx              # Root component, dark mode, routing
        ├── main.tsx             # Entry point with Toaster
        ├── index.css            # Global styles, CSS variables, scrollbar
        ├── types/
        │   └── index.ts         # All TypeScript interfaces
        ├── lib/
        │   └── utils.ts         # cn(), getEntityCategory(), groupEntities(), formatConfidence(), etc.
        ├── services/
        │   └── api.ts           # Axios instance, transcribeAudio()
        ├── store/
        │   └── appStore.ts      # Zustand store (navigation, upload, history, settings)
        └── components/
            ├── layout/
            │   ├── Sidebar.tsx  # Collapsible nav sidebar
            │   └── TopBar.tsx   # Sticky header with page title and buttons
            └── features/
                ├── upload/
                │   ├── StatsBar.tsx        # Three stat cards (transcriptions, confidence, time saved)
                │   ├── UploadZone.tsx      # Drag-and-drop file upload area
                │   ├── UploadCard.tsx      # Wrapper card with error/success states
                │   └── TranscribeButton.tsx # Processing bar and submit button
                └── results/
                    ├── ResultsPanel.tsx    # Animated wrapper for all result cards
                    ├── TranscriptionCard.tsx # Transcription text with speaker highlighting
                    ├── EntitiesCard.tsx    # Medical entity chips grouped by category
                    ├── EntityChip.tsx      # Individual coloured entity chip
                    └── SOAPNoteCard.tsx    # 2x2 editable SOAP sections with download
        └── pages/
            ├── LoginPage.tsx    # Full login/register page (UI only, auth in Week 11)
            ├── DashboardPage.tsx
            ├── HistoryPage.tsx
            └── SettingsPage.tsx
```

---

## 3. Design System

**Approved Prototype:** mediscribe-prototype-v3.html (on file, use as reference)

**Colour Palette:**
- Primary blue: `#1A56DB`
- Accent green: `#0BA871`
- Sidebar navy: `#0D1B2A`
- Background: `#F0F4F8`
- Dark mode background: `#0F172A`
- Card white: `#FFFFFF`
- Border: `#E2E8F0`
- Muted text: `#94A3B8`

**Typography:**
- Headings: Sora (font-head)
- Body: DM Sans (font-sans)
- Monospace/data: IBM Plex Mono (font-mono)

**Entity Category Colours:**
- SYMPTOM: Red chips with red left border
- MEDICATION: Blue chips with blue left border
- CONDITION: Purple chips with purple left border
- PROCEDURE: Green chips with green left border
- TEST: Amber/orange chips with amber left border
- OTHER: Grey chips with grey left border

**Border radius:** 10px default, 14px for cards
**Sidebar widths:** 220px expanded, 60px collapsed
**TopBar height:** 54px

---

## 4. Frontend Architecture (Week 9 Complete)

### Zustand Store (`src/store/appStore.ts`)

Persisted to localStorage via `zustand/middleware/persist`. Key: `mediscribe-storage`.

**Persisted slices:**
- `history` — array of HistoryEntry objects
- `profile` — UserProfile (firstName, lastName, email, specialty, hospital, licenseNo, avatarUrl)
- `preferences` — Preferences (autoScroll, compactView, showConfidence, autoCopy, darkMode)
- `notifications` — NotificationSettings (emailNotifs, transcriptDone, weeklyReport)
- `sidebarCollapsed` — boolean

**Non-persisted (reset on reload is correct behaviour):**
- `uploadState`, `selectedFile`, `transcriptionResult`, `processingStatus`, `errorMessage`
- `currentPage` — resets to `login` on reload

**Actions:**
- `setPage(page)` — navigate between pages
- `toggleSidebar()` — collapse/expand sidebar
- `setFile(file)` — select audio file (null clears)
- `setUploadState(state)` — idle | selected | processing | done | error
- `setProcessingStatus(msg)` — update processing stage text
- `setResult(result)` — store transcription result, set state to done
- `setError(msg)` — store error, set state to error
- `clearUpload()` — reset all upload state
- `addToHistory(result, file)` — create HistoryEntry and prepend to history array
- `deleteHistoryItem(id)` — remove by id
- `clearHistory()` — empty array
- `updateProfile(partial)` — merge into profile
- `updatePreferences(partial)` — merge into preferences (darkMode triggers useEffect in App.tsx)
- `updateNotifications(partial)` — merge into notifications

### TypeScript Types (`src/types/index.ts`)

```typescript
MedicalEntity        { text, label, confidence, start, end }
SOAPNote             { subjective, objective, assessment, plan }
TranscriptionResult  { transcription, entities, soap_note, confidence_score }
EntityCategory       'SYMPTOM' | 'MEDICATION' | 'CONDITION' | 'PROCEDURE' | 'TEST' | 'OTHER'
GroupedEntities      { symptoms, medications, conditions, procedures, tests, other }
HistoryEntry         { id, date, patientId, duration, entityCount, confidenceScore, status, result }
UploadState          'idle' | 'selected' | 'processing' | 'done' | 'error'
AppPage              'login' | 'dashboard' | 'history' | 'settings'
UserProfile          { firstName, lastName, email, specialty, hospital, licenseNo, avatarUrl }
Preferences          { autoScroll, compactView, showConfidence, autoCopy, darkMode }
NotificationSettings { emailNotifs, transcriptDone, weeklyReport }
```

### Utility Functions (`src/lib/utils.ts`)

- `cn(...inputs)` — Tailwind class merging with clsx + tailwind-merge
- `getEntityCategory(label, text?)` — Maps to EntityCategory. Now handles CHEMICAL → MEDICATION and DISEASE → CONDITION (from en_ner_bc5cdr_md). Keyword matching retained as fallback for any remaining generic labels.
- `groupEntities(entities)` — Groups flat entity array into GroupedEntities buckets
- `formatConfidence(score)` — Converts 0-1 or 0-100 to percentage string
- `getEntityStyles(category)` — Returns { bg, border, text, dot } Tailwind classes per category
- `generatePatientId()` — Returns random PT-##### string
- `formatDate(date)` — Returns "Feb 20, 2026 · 9:14 AM"

**IMPORTANT — utils.ts change made in Week 9.5:**
`getEntityCategory()` now includes these two cases before the keyword fallback:
```typescript
if (l === 'CHEMICAL') return 'MEDICATION'
if (l === 'DISEASE')  return 'CONDITION'
```

### API Service (`src/services/api.ts`)

- Base URL: `import.meta.env.VITE_API_URL || 'http://localhost:8000'`
- Timeout: 120 seconds
- `transcribeAudio(file: File)` — POST multipart/form-data to `/api/transcribe`
- Returns `TranscriptionResult`

### Routing

Handled by Zustand `currentPage` state, not React Router. App.tsx conditionally renders pages. Login page renders full-screen with no sidebar/topbar.

---

## 5. Pages — Current State

### LoginPage (`src/pages/LoginPage.tsx`)
**Status:** UI complete, authentication is mock/simulated only.

- Two-panel layout: left navy panel (hidden on mobile) with branding, stats, testimonial; right panel with form
- Modes: login and register (toggle with link)
- Login fields: email, password (with show/hide toggle), remember me checkbox, forgot password link
- Register fields: additionally firstName, lastName, specialty
- Submit: 1.2 second simulated delay, success toast, redirects to dashboard after 600ms
- Google SSO button: shows info toast ("coming in Week 11")
- Forgot password: shows info toast ("coming in Week 11")
- Sign Out in sidebar: navigates back to login page

**IMPORTANT:** No real authentication exists. Any email/password combination works. Real auth is Week 11.

### DashboardPage (`src/pages/DashboardPage.tsx`)
- StatsBar: three cards (Total Transcriptions, Avg Confidence, Time Saved) — all live from Zustand history
- UploadCard: wraps UploadZone + TranscribeButton + error/success banners
- ResultsPanel: appears after transcription, three stacked cards

**Upload flow:**
1. UploadZone: idle state shows drag-drop area; selected state shows green file card with fake audio player
2. TranscribeButton: appears when file is selected; animates fake progress bar through 5 stages while API call runs; real progress completes at 100% then short pause before results appear
3. ResultsPanel: auto-scrolls into view (if autoScroll preference is on); three cards stacked vertically

**Preferences that affect Dashboard:**
- `autoScroll` — controls whether ResultsPanel scrolls into view
- `showConfidence` — shows/hides confidence bar in TranscriptionCard
- `autoCopy` — auto-copies transcription text to clipboard on completion
- `compactView` — reduces padding on all three result cards

### HistoryPage (`src/pages/HistoryPage.tsx`)
- Search input: filters by patientId or date string
- Confidence filter dropdown: All / High (>=80%) / Medium (60-80%) / Low (<60%)
- Delete All button: opens confirmation modal showing count, requires second click
- Empty state: shown when history is empty with "Start a Transcription" button
- No results state: shown when search/filter returns nothing, with "Clear filters" link
- Table columns: Date & Time, Patient ID, Entities, Confidence (colour-coded badge), Status, Actions
- Row actions: View (loads result onto dashboard), Download (exports SOAP as .txt), Delete (removes entry with toast)
- Footer: shows "Showing X of Y transcriptions"
- Confidence stored as 0-100 number (normalised on addToHistory, not on display)

### SettingsPage (`src/pages/SettingsPage.tsx`)
Two-column layout: left tab nav, right content panel.

**Profile tab:**
- Avatar circle with initials or uploaded photo preview
- Camera icon and "Change photo" link both trigger hidden file input
- File validation: JPG/PNG/WebP/GIF only, max 2MB
- Photo stored as base64 dataURL in Zustand profile.avatarUrl
- Form fields: First Name, Last Name, Email, Specialty, Hospital, Medical License No.
- Draft state: edits are local until "Save Changes" is clicked (commits to Zustand)
- "Discard" resets draft to last saved state
- All changes persist across page navigation and browser reload (Zustand persist)

**Preferences tab:**
All toggles write directly to Zustand `preferences` and persist immediately.
- Dark Mode — applies `dark` class to `<html>` via useEffect in App.tsx
- Auto-scroll to Results — controls ResultsPanel scroll behaviour
- Compact View — reduces padding on result cards (prop passed down)
- Show Confidence Score — shows/hides confidence strip in TranscriptionCard
- Auto-copy Transcription — auto-copies text to clipboard on transcription completion

**Notifications tab:**
All toggles write directly to Zustand `notifications` and persist.
- Email Notifications — UI only, no backend email service exists yet
- Weekly Usage Report — UI only, same reason
- Transcription Complete — when OFF, suppresses the Sonner success toast after transcription finishes

**API & Integrations tab:**
- Backend URL display (static, not editable yet)
- Green "connected" status indicator with pulse animation
- Endpoint reference table (POST /api/transcribe, GET /api/health, POST /api/validate)

**Danger Zone tab:**
- Clear Transcription History button (disabled when history is empty) — opens confirmation modal
- Reset All Settings button — resets preferences and notifications to defaults, shows info toast

### Sidebar (`src/components/layout/Sidebar.tsx`)
- Fixed left, 220px expanded / 60px collapsed
- Dark navy (`#0D1B2A`) background
- Logo row: gradient Zap icon + "MediScribe AI" text + "Clinical" subtext
- Toggle button: its own full-width row between logo and nav. When collapsed: centred ChevronRight icon. When expanded: "Collapse" text + ChevronLeft icon aligned right.
- Nav sections: WORKSPACE (Dashboard, History with badge count), ACCOUNT (Settings, Sign Out)
- Sign Out navigates to login page
- Tooltips appear on hover when collapsed
- User pill at bottom: avatar with initials (or photo from profile), name, role
- Smooth 240ms transitions

### TopBar (`src/components/layout/TopBar.tsx`)
- Sticky, 54px height, white background
- Page title (dynamic from currentPage)
- Date (font-mono, hidden on small screens)
- Alerts button (ghost style, visible border and text)
- New Transcription button (primary blue, only shown when NOT on dashboard — navigates to dashboard)

---

## 6. Backend — Current State (Updated Week 9.5)

**Files:**
- `backend/main.py` — FastAPI app, CORS, `/api/transcribe` endpoint
- `backend/transcription.py` — Whisper transcription
- `backend/entity_extraction.py` — scispacy entity extraction (now uses en_ner_bc5cdr_md)
- `backend/medical_categories.py` — 837 term medical dictionary
- `backend/soap_generator.py` — Groq-powered SOAP generation with rule-based fallback (FULLY REWRITTEN Week 9.5)
- `backend/content_validator.py` — Medical content density validation
- `backend/spell_correction.py` — DISABLED, built with RapidFuzz

### SOAP Generation — Groq Implementation (Week 9.5)

**Model:** `llama-3.3-70b-versatile` via Groq API (free tier)
**SDK:** `groq>=0.9.0`
**Key:** `GROQ_API_KEY` in `.env`
**Fallback:** Rule-based generation runs automatically if Groq call fails for any reason

**Critical implementation note — main.py import order:**
`load_dotenv()` MUST be called before any local module imports. The correct order at the top of `main.py` is:
```python
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, ...
from soap_generator import generate_soap_note, format_soap_note_text
from entity_extraction import extract_medical_entities
# etc.
```
If `load_dotenv()` comes after the local imports, `os.getenv("GROQ_API_KEY")` returns None when soap_generator initialises and every request falls back to rule-based generation.

**SOAP generation philosophy — Documentation Enhancer:**
The system operates as a documentation enhancer, not a pure transcription structurer. It adds standard-of-care items clinically implied by the presentation (cardiac monitoring, IV access, serial ECGs, troponins, NPO status, etc.) even if not explicitly spoken, stating them as direct actions without labelling them as "protocol."

**Current system prompt covers:**
- Strict SOAP section boundaries — zero diagnostic interpretation in Subjective or Objective
- OPQRST structure written as fluent clinical prose (not mechanical labelled lines)
- Missing data transparency — "not documented in transcript" for absent data points
- Medication name normalisation — corrects phonetic misspellings to formulary standard (e.g. "lysinoprell" → lisinopril, "adervastatin" → atorvastatin)
- Numbered problem-based Assessment with precision language ("highly concerning for", "likely", "consistent with")
- Strict diagnostic taxonomy — subtypes never listed parallel to parent category (e.g. STEMI/NSTEMI/UA listed as subtypes of ACS, not alongside it)
- Differential diagnosis using "less likely given current symptom description" — never implies exclusion based on absence of documentation
- Expanded Plan with standard-of-care items stated as direct actions
- Patient counselling, disposition, and urgency classification included when relevant

**SOAP note quality — physician review history:**
This system prompt has been through four iterative review cycles with a real physician:
- Review 1: Identified poor SOAP boundaries, no clinical prose, rule-based output
- Review 2: Structural improvement confirmed, requested OPQRST scaffolding and missing-data transparency
- Review 3: Rated "Near Production" — requested medication normalisation, removal of "per standard protocol" labelling, differential safety language fix
- Review 4 (current): Rated "Near Production / Very High on clinical logic" — remaining refinements are minor. Current prompt addresses all four review cycles.

**Doctor's final assessment of current output:**
"Structural Discipline: Very High, Clinical Logic: Very High, Documentation Completeness: High, Professional Authenticity: Moderate-High, Deployment Readiness: Near Production"

### Entity Extraction — Upgraded Model (Week 9.5)

**Previous model:** `en_core_sci_sm` — returned generic `ENTITY` label for all entities
**Current model:** `en_ner_bc5cdr_md` — returns `CHEMICAL` (medications) and `DISEASE` (conditions)

**Install command used:**
```bash
pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_bc5cdr_md-0.5.4.tar.gz --break-system-packages
```

**Frontend change made in utils.ts:**
```typescript
if (l === 'CHEMICAL') return 'MEDICATION'
if (l === 'DISEASE')  return 'CONDITION'
```
These two cases were added before the keyword fallback in `getEntityCategory()`.

### Content Validation — No Changes Yet

The 10% medical term density minimum and 2 clinical markers minimum were kept unchanged in Week 9.5. These thresholds are independent of the scispacy model and the Groq layer — the validator runs on raw Whisper transcription text using its own dictionary-based density calculation. Recalibration is scheduled for Week 10 after running all 5 test scenarios through the full pipeline.

### requirements.txt — Current State

```
fastapi==0.104.1
uvicorn==0.24.0
python-multipart==0.0.6
websockets==12.0
python-dotenv==1.0.0
groq>=0.9.0
openai-whisper
scispacy
spacy
https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_bc5cdr_md-0.5.4.tar.gz
rapidfuzz==3.6.1
```

---

## 7. API Response Structure

**Current backend response from `/api/transcribe`:**
```json
{
  "success": true,
  "transcription": "Patient is a 52-year old male...",
  "entities": [
    {
      "text": "chest pain",
      "label": "DISEASE",
      "start": 0,
      "end": 10,
      "confidence": 0.95
    }
  ],
  "soap_note": {
    "subjective": "...",
    "objective": "...",
    "assessment": "...",
    "plan": "..."
  },
  "confidence_score": 0.86
}
```

**Note on entity labels:** Entity labels now return as `CHEMICAL` or `DISEASE` from en_ner_bc5cdr_md. The frontend `getEntityCategory()` maps these to MEDICATION and CONDITION respectively. Some entities may still return generic labels depending on what the model recognises — the keyword fallback handles those.

**IMPORTANT — confidence_score format:**
Backend returns `confidence_score` as a decimal between 0 and 1 (e.g. 0.86).
Frontend normalises this to 0-100 at the point of `addToHistory()` in the Zustand store.
The `formatConfidence()` utility handles both 0-1 and 0-100 inputs for display.
The History page stores and reads the 0-100 normalised value.

**SOAP note shape — dual format:**
The Groq path returns SOAP sections as plain prose strings. The fallback path returns structured dicts. The frontend SOAPNoteCard and format_soap_note_text() handle both shapes. The `source` field in the response indicates which path ran: `"groq-llama-3.3-70b-versatile"` or `"rule-based-fallback"`.

---

## 8. Preferences and Their Effects

| Preference | Where it takes effect |
|---|---|
| darkMode | App.tsx useEffect adds/removes `dark` class on `<html>` |
| autoScroll | ResultsPanel.tsx useEffect — scrollIntoView on results appear |
| compactView | ResultsPanel passes `compact` prop to all three result cards, reducing padding |
| showConfidence | TranscriptionCard.tsx — hides/shows confidence strip section |
| autoCopy | TranscriptionCard.tsx useEffect — auto-copies to clipboard when transcription loads |
| transcriptDone | TranscribeButton.tsx — conditionally calls `toast.success()` after completion |
| emailNotifs | UI only — no backend email service, noted for backlog |
| weeklyReport | UI only — no backend, noted for backlog |

---

## 9. Known Frontend Limitations and Notes

**Entity colour coding:**
The frontend `getEntityCategory()` now correctly maps CHEMICAL → MEDICATION and DISEASE → CONDITION from the upgraded scispacy model. Keyword fallback is retained for any entities the model labels generically. Coverage should be significantly better than the old en_core_sci_sm model.

**Login is UI-only:**
Any email/password combination logs in. No token is stored, no session persists across reload (reload returns to login screen, which is correct for now). Real auth, JWT, protected routes are all Week 11.

**History is in-memory (Zustand + localStorage):**
History persists across browser sessions via Zustand persist middleware. It will be replaced with real PostgreSQL persistence in Week 12. Clearing localStorage clears all history.

**Profile photo:**
Stored as base64 dataURL in Zustand/localStorage. This is fine for a prototype but will hit localStorage limits with large images. Week 12 database integration should move this to server-side storage.

**Email and weekly report notifications:**
Toggling these in Settings has no effect beyond the UI state persisting. Actual email sending requires a backend email service (SendGrid, SMTP, etc.) which is not yet implemented.

**SOAP note editing:**
The SOAP note card uses textarea elements that allow the user to edit the content. These edits are stored in local React state only and are NOT persisted. Refreshing the page or loading a new transcription discards edits. Week 12 database integration should add a save-edits endpoint.

---

## 10. Development Commands

```bash
# Backend (run from /workspaces/mediscribe-ai/backend/)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (run from /workspaces/mediscribe-ai/frontend/)
npm run dev
# Runs at http://localhost:5173

# Git (run from /workspaces/mediscribe-ai/)
git add .
git commit -m "description"
git push
# All changes go to the recent-updates branch
```

**Branch note:** All development happens on `recent-updates` branch. The `main` branch has the old frontend. When the new frontend is ready to merge, the old `frontend/` folder must be deleted from main first.

---

## 11. Progress Snapshot — As of March 1, 2026

### Completed

**Weeks 1-2 (Backend Foundation):**
- FastAPI server, Whisper transcription, scispacy entity extraction
- Entity categorisation with 700+ term dictionary (now 837 terms)
- Smart entity merging (dynamic, data-driven)
- Content validation system

**Weeks 6-7 (Original Frontend — Scrapped):**
- Basic React + JSX frontend (deleted, replaced in Week 9)

**Week 8 (UI/UX Design):**
- Created interactive HTML prototype (v1, v2, v3)
- Finalised design system: blue/navy/green palette, Sora/DM Sans/IBM Plex Mono fonts
- Approved v3 prototype as reference for React build

**Week 9 (React Frontend Rebuild — COMPLETE):**
- Fresh Vite + React 18 + TypeScript project
- Tailwind CSS v3 with custom design tokens
- shadcn/ui base components
- Full type system (src/types/index.ts)
- Utility functions (src/lib/utils.ts)
- Axios API service (src/services/api.ts)
- Zustand store with persist middleware (src/store/appStore.ts)
- Sidebar with collapse/expand (with always-visible toggle button)
- TopBar with dynamic title and action buttons
- App.tsx shell with dark mode, routing, margin transitions
- Dashboard: StatsBar + UploadCard + ResultsPanel
  - Drag-drop upload zone
  - File selected state with audio player UI
  - Fake progress bar through 5 processing stages
  - TranscriptionCard with speaker highlighting and copy button
  - EntitiesCard with category-grouped colour chips
  - SOAPNoteCard with 2x2 editable grid, copy all, download
- History page: search, confidence filter, sortable table, view/download/delete actions, Delete All modal
- Settings page: Profile (with real photo upload), Preferences (all wired), Notifications, API tab, Danger Zone
- Login page: left branding panel + right form, login/register modes, show/hide password
- All preferences functional and persisted
- Dark mode working (html class toggle)
- Confidence score normalisation fixed (backend 0-1 → stored as 0-100)
- Sidebar collapse/expand fully working in both directions

**Week 9.5 (Backend Improvements — COMPLETE):**
- Upgraded scispacy model from en_core_sci_sm to en_ner_bc5cdr_md
- Updated entity_extraction.py to load new model
- Updated utils.ts to map CHEMICAL → MEDICATION and DISEASE → CONDITION
- Rewrote soap_generator.py to use Groq API (llama-3.3-70b-versatile, free tier)
- Fixed main.py import order — load_dotenv() moved to top before all local imports
- Iterated SOAP system prompt through 4 physician review cycles
- Current SOAP output rated: Structural Discipline Very High, Clinical Logic Very High, Deployment Readiness Near Production
- All backend changes committed to recent-updates branch

### Not Yet Started / In Progress

- **Week 10 (IMMEDIATE NEXT):** Frontend testing and bug fixes across all 5 test scenarios
- Week 11: Authentication (backend JWT + frontend wiring)
- Week 12: Database integration (PostgreSQL, replace localStorage history)
- Week 13: Docker containerisation
- Week 14: Testing & QA (20+ test scenarios)
- Week 15-16: Deployment (Railway backend, Vercel frontend)
- Week 17: User testing
- Week 18-19: Documentation and demo video
- Week 20: Final polish and launch

---

## 12. Week 10 Testing Plan (Immediate Next Task)

Run all 5 existing test audio scenarios through the full pipeline and check the following for each:

**Backend checks:**
- Console shows `SOAP note generated via Groq llama-3.3-70b-versatile` (not fallback)
- Entity extraction shows correct counts per category
- Content validation passes with high confidence

**Frontend checks:**
- Entity chips render with correct colours per category (CHEMICAL → blue/MEDICATION, DISEASE → purple/CONDITION)
- SOAP sections display as readable prose (not structured dicts)
- SOAPNoteCard 2x2 grid renders all four sections
- Transcription text visible in TranscriptionCard
- History entry created after each transcription
- History page shows all 5 entries searchable and filterable
- Download from History exports correct SOAP content
- Dark mode renders correctly across all pages
- Compact view reduces padding correctly
- Settings changes persist across page reload

**Content validator recalibration:**
After running all 5 scenarios, review the validation confidence scores. Current thresholds: min_density=0.10, min_markers=2. Adjust if any valid medical audio is being incorrectly rejected or if non-medical content is passing.

---

## 13. Backend Remaining Improvement Backlog

These are lower-priority improvements identified during physician review but not yet implemented. Consider for Week 14 QA phase.

### Complaint-based smart templates
For high-risk chief complaints (chest pain, dyspnoea, syncope), the system prompt already handles these fairly well. A future improvement would be to detect the chief complaint in the transcription and inject a complaint-specific checklist into the prompt dynamically. This would improve completeness for edge cases.

### Medication normalisation verification
The current system prompt instructs the model to correct phonetic medication misspellings. This works well in testing (lisinopril, atorvastatin corrected correctly). A more robust solution would be a post-processing layer that checks medication names against a formulary dictionary (RapidFuzz already installed for this purpose). Scheduled for consideration in Week 14.

### SOAP note edit persistence
Currently SOAP edits in the frontend are local React state only. Week 12 database integration should include a PATCH /api/soap/{id} endpoint to persist physician edits.

---

## 14. Resume / Portfolio Notes

When this project is complete, the student should be able to say:

"Built MediScribe AI, a full-stack medical transcription system using OpenAI Whisper for speech-to-text, scispacy (en_ner_bc5cdr_md) for medical NLP, and Groq's llama-3.3-70b-versatile for SOAP note generation. Architected a FastAPI backend processing clinical audio with sub-5-second latency. Implemented intelligent entity extraction with dynamic compound term merging across 837 medical terms. Rebuilt the frontend from scratch in React 18 + TypeScript with Zustand state management, achieving a Behance-quality clinical interface with persistent settings, dark mode, editable SOAP notes, and full transcription history. Iterated SOAP generation quality through four physician review cycles, achieving Near Production clinical documentation quality. Delivered as a containerised application deployed on Railway and Vercel."

**Key Metrics:**
- Medical term coverage: 837 terms across 7+ specialties
- Transcription latency: 3-5 seconds per minute of audio
- Entity categorisation: significantly improved with en_ner_bc5cdr_md (CHEMICAL/DISEASE labels)
- SOAP quality: Near Production per physician review (4 iteration cycles documented)
- Technologies: FastAPI, Whisper, scispacy, Groq API, React 18, TypeScript, Zustand, Tailwind CSS, shadcn/ui, PostgreSQL (planned), Docker (planned), Railway, Vercel

**Portfolio differentiator — physician review process:**
The iterative SOAP quality improvement process with real physician feedback across 4 documented cycles is a strong portfolio talking point. It demonstrates rigorous validation methodology, not just technical implementation.

---

## 15. Revised 20-Week Timeline

| Phase | Weeks | Status |
|---|---|---|
| Backend foundation | 1-2 | COMPLETE |
| Original frontend (scrapped) | 6-7 | REPLACED |
| UI/UX prototype design | 8 | COMPLETE |
| React frontend rebuild | 9 | COMPLETE |
| Backend improvements (SOAP + entities) | 9.5 | COMPLETE |
| Frontend testing and bug fixes | 10 | NEXT |
| Authentication | 11 | NOT STARTED |
| Database integration | 12 | NOT STARTED |
| Docker containerisation | 13 | NOT STARTED |
| Testing and QA | 13-14 | NOT STARTED |
| Deployment | 15-16 | NOT STARTED |
| User testing | 17 | NOT STARTED |
| Documentation and demo video | 18-19 | NOT STARTED |
| Final polish and launch | 20 | NOT STARTED |

**Current overall progress: approximately 50% complete**
**On track for May 2026 completion**

---

## 16. Instructions for Future Claude Sessions

### How to Resume Development

1. Read this entire memory file before responding to any request
2. Ask the student to paste relevant file contents before making changes — never assume what is in a file
3. Before writing code, confirm the current state matches what the memory file describes
4. All commits go to the `recent-updates` branch

### Context is Critical

- This is a 20-week educational and portfolio project
- Student has completed GRE (December 2025) and is working toward Canadian university applications
- Student understands React, TypeScript, Tailwind, and Zustand at an intermediate level after Week 9 work
- Backend is Python/FastAPI — student understands the architecture

### Student Skill Level (Updated March 2026)

- Python: Comfortable, can write and debug independently
- React + TypeScript: Intermediate — built full frontend in Week 9, understands components, hooks, props, state
- Tailwind CSS v3: Comfortable with utility classes and custom config
- Zustand: Understands store pattern, slices, persist middleware
- shadcn/ui: Knows how to use and customise components
- Git: Basic commands, uses `recent-updates` branch for all current work
- Backend: Understands FastAPI, scispacy pipeline, Groq SOAP generation
- ML/AI: Learning, improving through this project

### Student Preferences

- NO EMOJIS in code, UI, comments, or responses — use Lucide icons for UI
- Prefers detailed explanations with code examples
- Likes to understand WHY, not just HOW
- Professional tone throughout
- Motivated by seeing features work end-to-end
- Clean, maintainable code

### The 100% Free Constraint

Non-negotiable for all infrastructure. SOAP generation uses Groq free tier (14,400 requests/day, no credit card required). All other services must remain free: Codespaces, Railway free tier, Vercel free tier.

### Git Workflow

```bash
git add .
git commit -m "description"
git push
# All changes on recent-updates branch
```

### Development Environment

- Codespaces, ~15GB storage available
- Backend: `cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- Frontend: `cd frontend && npm run dev` (port 5173)
- Test backend: http://localhost:8000/docs
- Test frontend: http://localhost:5173

### Critical Reminders

1. Tailwind CSS must stay on v3 — shadcn/ui is incompatible with v4
2. Zustand store uses `partialize` to exclude non-serialisable File objects from persistence
3. Confidence score: backend returns 0-1, normalise to 0-100 on `addToHistory()`, keep as 0-100 everywhere else
4. AppPage type includes 'login' — always include it when updating types
5. Sidebar toggle is a full-width button row, NOT part of the logo row
6. All development commits to `recent-updates` branch
7. load_dotenv() in main.py MUST come before all local module imports — this caused a recurring bug in Week 9.5
8. Groq model is llama-3.3-70b-versatile — llama-3.1-70b-versatile was decommissioned
9. SOAP sections from Groq are plain prose strings; fallback sections are structured dicts — frontend handles both

---

*Last Updated: March 1, 2026*
*Session: Week 9.5 — Backend Improvements Complete*
*Changes this session: Groq SOAP generation implemented and iterated through 4 physician review cycles, en_ner_bc5cdr_md entity model upgrade, utils.ts CHEMICAL/DISEASE label mapping, main.py load_dotenv ordering fix*
*Next Session: Week 10 — Frontend testing across all 5 test scenarios, content validator recalibration*
*Active Branch: recent-updates*
*System Status: Frontend fully rebuilt (Week 9). Backend fully improved (Week 9.5). Groq SOAP generation working and physician-reviewed. Entity labels returning as CHEMICAL/DISEASE. All changes committed. Ready for Week 10 testing.*# MediScribe AI - Project Memory File

---

## 1. Project Summary

**Project Name:** MediScribe AI

**Description:** A production-ready medical transcription system that converts doctor-patient conversations into structured clinical documentation. Uses speech-to-text AI to transcribe audio, extracts medical entities (symptoms, medications, diagnoses), generates formatted SOAP notes, and provides secure multi-user access with database persistence. Reduces physician documentation time from 8 minutes to 3 minutes per patient.

**Primary Goals:**
- Build a complete portfolio project for Canadian university applications (McGill, Concordia, Windsor, Carleton) AND job applications
- Demonstrate advanced AI/ML skills with real-world healthcare application
- Create a fully functional, deployed demo accessible via public URL
- Demonstrate production engineering skills (Docker, PostgreSQL, authentication, deployment)
- Keep the entire project 100% FREE (no paid APIs or services) — SOAP generation uses Groq free tier (llama-3.3-70b-versatile), all other infrastructure is free
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
- en_ner_bc5cdr_md (v0.5.4) — Current biomedical NLP model (UPGRADED from en_core_sci_sm in Week 9.5). Returns CHEMICAL and DISEASE labels.
- SQLAlchemy — ORM for database operations (planned Week 12)
- Alembic — Database migrations (planned Week 12)
- python-jose — JWT token generation (planned Week 11)
- passlib + bcrypt — Password hashing (planned Week 11)
- groq Python SDK — For Groq SOAP generation via llama-3.3-70b-versatile (IMPLEMENTED in Week 9.5)

**Database:**
- PostgreSQL — Primary database for persistence (planned Week 12)
- Schema: users, transcriptions, medical_entities, soap_notes

**Authentication:**
- JWT (JSON Web Tokens) — Stateless authentication (planned Week 11)
- bcrypt — Secure password hashing
- Role-based access control

**Containerization:**
- Docker — Application containerisation (planned Week 13)
- docker-compose — Multi-container orchestration

**Deployment:**
- Railway — Backend + database hosting (free tier)
- Vercel — Frontend hosting (free tier)

**Development Environment:**
- GitHub Codespaces (~15GB storage available)
- VS Code in browser
- No local machine resources used

**Audio Processing:**
- ffmpeg — Audio file handling
- Whisper base model (140MB, downloaded once)

**Frontend (FULLY REBUILT - Week 9):**
- React 18 + TypeScript (.tsx files)
- Vite 7 — Build tool
- Tailwind CSS v3 (NOT v4 — shadcn compatibility requires v3)
- shadcn/ui — Base component library
- Framer Motion — Animations
- Lucide React — Icons
- Axios — HTTP client
- Zustand — State management (with persist middleware)
- Sonner — Toast notifications
- date-fns — Date formatting
- clsx + tailwind-merge + class-variance-authority — Class utilities

---

### File/Folder Structure

```
mediscribe-ai/
├── .env                          # Environment variables (NOT in Git)
├── .gitignore
├── README.md
├── backend/
│   ├── main.py                  # Main API server
│   ├── transcription.py         # Whisper transcription
│   ├── entity_extraction.py     # Medical entity extraction (upgraded model)
│   ├── medical_categories.py    # Medical term dictionaries (837 terms)
│   ├── medical_categories_backup.py
│   ├── soap_generator.py        # SOAP note generation (Groq-powered, IMPROVED)
│   ├── content_validator.py     # Medical content validation
│   ├── spell_correction.py      # DISABLED — built but not used
│   └── requirements.txt
└── frontend/                    # FULLY REBUILT in Week 9
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tsconfig.app.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── App.tsx              # Root component, dark mode, routing
        ├── main.tsx             # Entry point with Toaster
        ├── index.css            # Global styles, CSS variables, scrollbar
        ├── types/
        │   └── index.ts         # All TypeScript interfaces
        ├── lib/
        │   └── utils.ts         # cn(), getEntityCategory(), groupEntities(), formatConfidence(), etc.
        ├── services/
        │   └── api.ts           # Axios instance, transcribeAudio()
        ├── store/
        │   └── appStore.ts      # Zustand store (navigation, upload, history, settings)
        └── components/
            ├── layout/
            │   ├── Sidebar.tsx  # Collapsible nav sidebar
            │   └── TopBar.tsx   # Sticky header with page title and buttons
            └── features/
                ├── upload/
                │   ├── StatsBar.tsx        # Three stat cards (transcriptions, confidence, time saved)
                │   ├── UploadZone.tsx      # Drag-and-drop file upload area
                │   ├── UploadCard.tsx      # Wrapper card with error/success states
                │   └── TranscribeButton.tsx # Processing bar and submit button
                └── results/
                    ├── ResultsPanel.tsx    # Animated wrapper for all result cards
                    ├── TranscriptionCard.tsx # Transcription text with speaker highlighting
                    ├── EntitiesCard.tsx    # Medical entity chips grouped by category
                    ├── EntityChip.tsx      # Individual coloured entity chip
                    └── SOAPNoteCard.tsx    # 2x2 editable SOAP sections with download
        └── pages/
            ├── LoginPage.tsx    # Full login/register page (UI only, auth in Week 11)
            ├── DashboardPage.tsx
            ├── HistoryPage.tsx
            └── SettingsPage.tsx
```

---

## 3. Design System

**Approved Prototype:** mediscribe-prototype-v3.html (on file, use as reference)

**Colour Palette:**
- Primary blue: `#1A56DB`
- Accent green: `#0BA871`
- Sidebar navy: `#0D1B2A`
- Background: `#F0F4F8`
- Dark mode background: `#0F172A`
- Card white: `#FFFFFF`
- Border: `#E2E8F0`
- Muted text: `#94A3B8`

**Typography:**
- Headings: Sora (font-head)
- Body: DM Sans (font-sans)
- Monospace/data: IBM Plex Mono (font-mono)

**Entity Category Colours:**
- SYMPTOM: Red chips with red left border
- MEDICATION: Blue chips with blue left border
- CONDITION: Purple chips with purple left border
- PROCEDURE: Green chips with green left border
- TEST: Amber/orange chips with amber left border
- OTHER: Grey chips with grey left border

**Border radius:** 10px default, 14px for cards
**Sidebar widths:** 220px expanded, 60px collapsed
**TopBar height:** 54px

---

## 4. Frontend Architecture (Week 9 Complete)

### Zustand Store (`src/store/appStore.ts`)

Persisted to localStorage via `zustand/middleware/persist`. Key: `mediscribe-storage`.

**Persisted slices:**
- `history` — array of HistoryEntry objects
- `profile` — UserProfile (firstName, lastName, email, specialty, hospital, licenseNo, avatarUrl)
- `preferences` — Preferences (autoScroll, compactView, showConfidence, autoCopy, darkMode)
- `notifications` — NotificationSettings (emailNotifs, transcriptDone, weeklyReport)
- `sidebarCollapsed` — boolean

**Non-persisted (reset on reload is correct behaviour):**
- `uploadState`, `selectedFile`, `transcriptionResult`, `processingStatus`, `errorMessage`
- `currentPage` — resets to `login` on reload

**Actions:**
- `setPage(page)` — navigate between pages
- `toggleSidebar()` — collapse/expand sidebar
- `setFile(file)` — select audio file (null clears)
- `setUploadState(state)` — idle | selected | processing | done | error
- `setProcessingStatus(msg)` — update processing stage text
- `setResult(result)` — store transcription result, set state to done
- `setError(msg)` — store error, set state to error
- `clearUpload()` — reset all upload state
- `addToHistory(result, file)` — create HistoryEntry and prepend to history array
- `deleteHistoryItem(id)` — remove by id
- `clearHistory()` — empty array
- `updateProfile(partial)` — merge into profile
- `updatePreferences(partial)` — merge into preferences (darkMode triggers useEffect in App.tsx)
- `updateNotifications(partial)` — merge into notifications

### TypeScript Types (`src/types/index.ts`)

```typescript
MedicalEntity        { text, label, confidence, start, end }
SOAPNote             { subjective, objective, assessment, plan }
TranscriptionResult  { transcription, entities, soap_note, confidence_score }
EntityCategory       'SYMPTOM' | 'MEDICATION' | 'CONDITION' | 'PROCEDURE' | 'TEST' | 'OTHER'
GroupedEntities      { symptoms, medications, conditions, procedures, tests, other }
HistoryEntry         { id, date, patientId, duration, entityCount, confidenceScore, status, result }
UploadState          'idle' | 'selected' | 'processing' | 'done' | 'error'
AppPage              'login' | 'dashboard' | 'history' | 'settings'
UserProfile          { firstName, lastName, email, specialty, hospital, licenseNo, avatarUrl }
Preferences          { autoScroll, compactView, showConfidence, autoCopy, darkMode }
NotificationSettings { emailNotifs, transcriptDone, weeklyReport }
```

### Utility Functions (`src/lib/utils.ts`)

- `cn(...inputs)` — Tailwind class merging with clsx + tailwind-merge
- `getEntityCategory(label, text?)` — Maps to EntityCategory. Now handles CHEMICAL → MEDICATION and DISEASE → CONDITION (from en_ner_bc5cdr_md). Keyword matching retained as fallback for any remaining generic labels.
- `groupEntities(entities)` — Groups flat entity array into GroupedEntities buckets
- `formatConfidence(score)` — Converts 0-1 or 0-100 to percentage string
- `getEntityStyles(category)` — Returns { bg, border, text, dot } Tailwind classes per category
- `generatePatientId()` — Returns random PT-##### string
- `formatDate(date)` — Returns "Feb 20, 2026 · 9:14 AM"

**IMPORTANT — utils.ts change made in Week 9.5:**
`getEntityCategory()` now includes these two cases before the keyword fallback:
```typescript
if (l === 'CHEMICAL') return 'MEDICATION'
if (l === 'DISEASE')  return 'CONDITION'
```

### API Service (`src/services/api.ts`)

- Base URL: `import.meta.env.VITE_API_URL || 'http://localhost:8000'`
- Timeout: 120 seconds
- `transcribeAudio(file: File)` — POST multipart/form-data to `/api/transcribe`
- Returns `TranscriptionResult`

### Routing

Handled by Zustand `currentPage` state, not React Router. App.tsx conditionally renders pages. Login page renders full-screen with no sidebar/topbar.

---

## 5. Pages — Current State

### LoginPage (`src/pages/LoginPage.tsx`)
**Status:** UI complete, authentication is mock/simulated only.

- Two-panel layout: left navy panel (hidden on mobile) with branding, stats, testimonial; right panel with form
- Modes: login and register (toggle with link)
- Login fields: email, password (with show/hide toggle), remember me checkbox, forgot password link
- Register fields: additionally firstName, lastName, specialty
- Submit: 1.2 second simulated delay, success toast, redirects to dashboard after 600ms
- Google SSO button: shows info toast ("coming in Week 11")
- Forgot password: shows info toast ("coming in Week 11")
- Sign Out in sidebar: navigates back to login page

**IMPORTANT:** No real authentication exists. Any email/password combination works. Real auth is Week 11.

### DashboardPage (`src/pages/DashboardPage.tsx`)
- StatsBar: three cards (Total Transcriptions, Avg Confidence, Time Saved) — all live from Zustand history
- UploadCard: wraps UploadZone + TranscribeButton + error/success banners
- ResultsPanel: appears after transcription, three stacked cards

**Upload flow:**
1. UploadZone: idle state shows drag-drop area; selected state shows green file card with fake audio player
2. TranscribeButton: appears when file is selected; animates fake progress bar through 5 stages while API call runs; real progress completes at 100% then short pause before results appear
3. ResultsPanel: auto-scrolls into view (if autoScroll preference is on); three cards stacked vertically

**Preferences that affect Dashboard:**
- `autoScroll` — controls whether ResultsPanel scrolls into view
- `showConfidence` — shows/hides confidence bar in TranscriptionCard
- `autoCopy` — auto-copies transcription text to clipboard on completion
- `compactView` — reduces padding on all three result cards

### HistoryPage (`src/pages/HistoryPage.tsx`)
- Search input: filters by patientId or date string
- Confidence filter dropdown: All / High (>=80%) / Medium (60-80%) / Low (<60%)
- Delete All button: opens confirmation modal showing count, requires second click
- Empty state: shown when history is empty with "Start a Transcription" button
- No results state: shown when search/filter returns nothing, with "Clear filters" link
- Table columns: Date & Time, Patient ID, Entities, Confidence (colour-coded badge), Status, Actions
- Row actions: View (loads result onto dashboard), Download (exports SOAP as .txt), Delete (removes entry with toast)
- Footer: shows "Showing X of Y transcriptions"
- Confidence stored as 0-100 number (normalised on addToHistory, not on display)

### SettingsPage (`src/pages/SettingsPage.tsx`)
Two-column layout: left tab nav, right content panel.

**Profile tab:**
- Avatar circle with initials or uploaded photo preview
- Camera icon and "Change photo" link both trigger hidden file input
- File validation: JPG/PNG/WebP/GIF only, max 2MB
- Photo stored as base64 dataURL in Zustand profile.avatarUrl
- Form fields: First Name, Last Name, Email, Specialty, Hospital, Medical License No.
- Draft state: edits are local until "Save Changes" is clicked (commits to Zustand)
- "Discard" resets draft to last saved state
- All changes persist across page navigation and browser reload (Zustand persist)

**Preferences tab:**
All toggles write directly to Zustand `preferences` and persist immediately.
- Dark Mode — applies `dark` class to `<html>` via useEffect in App.tsx
- Auto-scroll to Results — controls ResultsPanel scroll behaviour
- Compact View — reduces padding on result cards (prop passed down)
- Show Confidence Score — shows/hides confidence strip in TranscriptionCard
- Auto-copy Transcription — auto-copies text to clipboard on transcription completion

**Notifications tab:**
All toggles write directly to Zustand `notifications` and persist.
- Email Notifications — UI only, no backend email service exists yet
- Weekly Usage Report — UI only, same reason
- Transcription Complete — when OFF, suppresses the Sonner success toast after transcription finishes

**API & Integrations tab:**
- Backend URL display (static, not editable yet)
- Green "connected" status indicator with pulse animation
- Endpoint reference table (POST /api/transcribe, GET /api/health, POST /api/validate)

**Danger Zone tab:**
- Clear Transcription History button (disabled when history is empty) — opens confirmation modal
- Reset All Settings button — resets preferences and notifications to defaults, shows info toast

### Sidebar (`src/components/layout/Sidebar.tsx`)
- Fixed left, 220px expanded / 60px collapsed
- Dark navy (`#0D1B2A`) background
- Logo row: gradient Zap icon + "MediScribe AI" text + "Clinical" subtext
- Toggle button: its own full-width row between logo and nav. When collapsed: centred ChevronRight icon. When expanded: "Collapse" text + ChevronLeft icon aligned right.
- Nav sections: WORKSPACE (Dashboard, History with badge count), ACCOUNT (Settings, Sign Out)
- Sign Out navigates to login page
- Tooltips appear on hover when collapsed
- User pill at bottom: avatar with initials (or photo from profile), name, role
- Smooth 240ms transitions

### TopBar (`src/components/layout/TopBar.tsx`)
- Sticky, 54px height, white background
- Page title (dynamic from currentPage)
- Date (font-mono, hidden on small screens)
- Alerts button (ghost style, visible border and text)
- New Transcription button (primary blue, only shown when NOT on dashboard — navigates to dashboard)

---

## 6. Backend — Current State (Updated Week 9.5)

**Files:**
- `backend/main.py` — FastAPI app, CORS, `/api/transcribe` endpoint
- `backend/transcription.py` — Whisper transcription
- `backend/entity_extraction.py` — scispacy entity extraction (now uses en_ner_bc5cdr_md)
- `backend/medical_categories.py` — 837 term medical dictionary
- `backend/soap_generator.py` — Groq-powered SOAP generation with rule-based fallback (FULLY REWRITTEN Week 9.5)
- `backend/content_validator.py` — Medical content density validation
- `backend/spell_correction.py` — DISABLED, built with RapidFuzz

### SOAP Generation — Groq Implementation (Week 9.5)

**Model:** `llama-3.3-70b-versatile` via Groq API (free tier)
**SDK:** `groq>=0.9.0`
**Key:** `GROQ_API_KEY` in `.env`
**Fallback:** Rule-based generation runs automatically if Groq call fails for any reason

**Critical implementation note — main.py import order:**
`load_dotenv()` MUST be called before any local module imports. The correct order at the top of `main.py` is:
```python
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, ...
from soap_generator import generate_soap_note, format_soap_note_text
from entity_extraction import extract_medical_entities
# etc.
```
If `load_dotenv()` comes after the local imports, `os.getenv("GROQ_API_KEY")` returns None when soap_generator initialises and every request falls back to rule-based generation.

**SOAP generation philosophy — Documentation Enhancer:**
The system operates as a documentation enhancer, not a pure transcription structurer. It adds standard-of-care items clinically implied by the presentation (cardiac monitoring, IV access, serial ECGs, troponins, NPO status, etc.) even if not explicitly spoken, stating them as direct actions without labelling them as "protocol."

**Current system prompt covers:**
- Strict SOAP section boundaries — zero diagnostic interpretation in Subjective or Objective
- OPQRST structure written as fluent clinical prose (not mechanical labelled lines)
- Missing data transparency — "not documented in transcript" for absent data points
- Medication name normalisation — corrects phonetic misspellings to formulary standard (e.g. "lysinoprell" → lisinopril, "adervastatin" → atorvastatin)
- Numbered problem-based Assessment with precision language ("highly concerning for", "likely", "consistent with")
- Strict diagnostic taxonomy — subtypes never listed parallel to parent category (e.g. STEMI/NSTEMI/UA listed as subtypes of ACS, not alongside it)
- Differential diagnosis using "less likely given current symptom description" — never implies exclusion based on absence of documentation
- Expanded Plan with standard-of-care items stated as direct actions
- Patient counselling, disposition, and urgency classification included when relevant

**SOAP note quality — physician review history:**
This system prompt has been through four iterative review cycles with a real physician:
- Review 1: Identified poor SOAP boundaries, no clinical prose, rule-based output
- Review 2: Structural improvement confirmed, requested OPQRST scaffolding and missing-data transparency
- Review 3: Rated "Near Production" — requested medication normalisation, removal of "per standard protocol" labelling, differential safety language fix
- Review 4 (current): Rated "Near Production / Very High on clinical logic" — remaining refinements are minor. Current prompt addresses all four review cycles.

**Doctor's final assessment of current output:**
"Structural Discipline: Very High, Clinical Logic: Very High, Documentation Completeness: High, Professional Authenticity: Moderate-High, Deployment Readiness: Near Production"

### Entity Extraction — Upgraded Model (Week 9.5)

**Previous model:** `en_core_sci_sm` — returned generic `ENTITY` label for all entities
**Current model:** `en_ner_bc5cdr_md` — returns `CHEMICAL` (medications) and `DISEASE` (conditions)

**Install command used:**
```bash
pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_bc5cdr_md-0.5.4.tar.gz --break-system-packages
```

**Frontend change made in utils.ts:**
```typescript
if (l === 'CHEMICAL') return 'MEDICATION'
if (l === 'DISEASE')  return 'CONDITION'
```
These two cases were added before the keyword fallback in `getEntityCategory()`.

### Content Validation — No Changes Yet

The 10% medical term density minimum and 2 clinical markers minimum were kept unchanged in Week 9.5. These thresholds are independent of the scispacy model and the Groq layer — the validator runs on raw Whisper transcription text using its own dictionary-based density calculation. Recalibration is scheduled for Week 10 after running all 5 test scenarios through the full pipeline.

### requirements.txt — Current State

```
fastapi==0.104.1
uvicorn==0.24.0
python-multipart==0.0.6
websockets==12.0
python-dotenv==1.0.0
groq>=0.9.0
openai-whisper
scispacy
spacy
https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_bc5cdr_md-0.5.4.tar.gz
rapidfuzz==3.6.1
```

---

## 7. API Response Structure

**Current backend response from `/api/transcribe`:**
```json
{
  "success": true,
  "transcription": "Patient is a 52-year old male...",
  "entities": [
    {
      "text": "chest pain",
      "label": "DISEASE",
      "start": 0,
      "end": 10,
      "confidence": 0.95
    }
  ],
  "soap_note": {
    "subjective": "...",
    "objective": "...",
    "assessment": "...",
    "plan": "..."
  },
  "confidence_score": 0.86
}
```

**Note on entity labels:** Entity labels now return as `CHEMICAL` or `DISEASE` from en_ner_bc5cdr_md. The frontend `getEntityCategory()` maps these to MEDICATION and CONDITION respectively. Some entities may still return generic labels depending on what the model recognises — the keyword fallback handles those.

**IMPORTANT — confidence_score format:**
Backend returns `confidence_score` as a decimal between 0 and 1 (e.g. 0.86).
Frontend normalises this to 0-100 at the point of `addToHistory()` in the Zustand store.
The `formatConfidence()` utility handles both 0-1 and 0-100 inputs for display.
The History page stores and reads the 0-100 normalised value.

**SOAP note shape — dual format:**
The Groq path returns SOAP sections as plain prose strings. The fallback path returns structured dicts. The frontend SOAPNoteCard and format_soap_note_text() handle both shapes. The `source` field in the response indicates which path ran: `"groq-llama-3.3-70b-versatile"` or `"rule-based-fallback"`.

---

## 8. Preferences and Their Effects

| Preference | Where it takes effect |
|---|---|
| darkMode | App.tsx useEffect adds/removes `dark` class on `<html>` |
| autoScroll | ResultsPanel.tsx useEffect — scrollIntoView on results appear |
| compactView | ResultsPanel passes `compact` prop to all three result cards, reducing padding |
| showConfidence | TranscriptionCard.tsx — hides/shows confidence strip section |
| autoCopy | TranscriptionCard.tsx useEffect — auto-copies to clipboard when transcription loads |
| transcriptDone | TranscribeButton.tsx — conditionally calls `toast.success()` after completion |
| emailNotifs | UI only — no backend email service, noted for backlog |
| weeklyReport | UI only — no backend, noted for backlog |

---

## 9. Known Frontend Limitations and Notes

**Entity colour coding:**
The frontend `getEntityCategory()` now correctly maps CHEMICAL → MEDICATION and DISEASE → CONDITION from the upgraded scispacy model. Keyword fallback is retained for any entities the model labels generically. Coverage should be significantly better than the old en_core_sci_sm model.

**Login is UI-only:**
Any email/password combination logs in. No token is stored, no session persists across reload (reload returns to login screen, which is correct for now). Real auth, JWT, protected routes are all Week 11.

**History is in-memory (Zustand + localStorage):**
History persists across browser sessions via Zustand persist middleware. It will be replaced with real PostgreSQL persistence in Week 12. Clearing localStorage clears all history.

**Profile photo:**
Stored as base64 dataURL in Zustand/localStorage. This is fine for a prototype but will hit localStorage limits with large images. Week 12 database integration should move this to server-side storage.

**Email and weekly report notifications:**
Toggling these in Settings has no effect beyond the UI state persisting. Actual email sending requires a backend email service (SendGrid, SMTP, etc.) which is not yet implemented.

**SOAP note editing:**
The SOAP note card uses textarea elements that allow the user to edit the content. These edits are stored in local React state only and are NOT persisted. Refreshing the page or loading a new transcription discards edits. Week 12 database integration should add a save-edits endpoint.

---

## 10. Development Commands

```bash
# Backend (run from /workspaces/mediscribe-ai/backend/)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (run from /workspaces/mediscribe-ai/frontend/)
npm run dev
# Runs at http://localhost:5173

# Git (run from /workspaces/mediscribe-ai/)
git add .
git commit -m "description"
git push
# All changes go to the recent-updates branch
```

**Branch note:** All development happens on `recent-updates` branch. The `main` branch has the old frontend. When the new frontend is ready to merge, the old `frontend/` folder must be deleted from main first.

---

## 11. Progress Snapshot — As of March 1, 2026

### Completed

**Weeks 1-2 (Backend Foundation):**
- FastAPI server, Whisper transcription, scispacy entity extraction
- Entity categorisation with 700+ term dictionary (now 837 terms)
- Smart entity merging (dynamic, data-driven)
- Content validation system

**Weeks 6-7 (Original Frontend — Scrapped):**
- Basic React + JSX frontend (deleted, replaced in Week 9)

**Week 8 (UI/UX Design):**
- Created interactive HTML prototype (v1, v2, v3)
- Finalised design system: blue/navy/green palette, Sora/DM Sans/IBM Plex Mono fonts
- Approved v3 prototype as reference for React build

**Week 9 (React Frontend Rebuild — COMPLETE):**
- Fresh Vite + React 18 + TypeScript project
- Tailwind CSS v3 with custom design tokens
- shadcn/ui base components
- Full type system (src/types/index.ts)
- Utility functions (src/lib/utils.ts)
- Axios API service (src/services/api.ts)
- Zustand store with persist middleware (src/store/appStore.ts)
- Sidebar with collapse/expand (with always-visible toggle button)
- TopBar with dynamic title and action buttons
- App.tsx shell with dark mode, routing, margin transitions
- Dashboard: StatsBar + UploadCard + ResultsPanel
  - Drag-drop upload zone
  - File selected state with audio player UI
  - Fake progress bar through 5 processing stages
  - TranscriptionCard with speaker highlighting and copy button
  - EntitiesCard with category-grouped colour chips
  - SOAPNoteCard with 2x2 editable grid, copy all, download
- History page: search, confidence filter, sortable table, view/download/delete actions, Delete All modal
- Settings page: Profile (with real photo upload), Preferences (all wired), Notifications, API tab, Danger Zone
- Login page: left branding panel + right form, login/register modes, show/hide password
- All preferences functional and persisted
- Dark mode working (html class toggle)
- Confidence score normalisation fixed (backend 0-1 → stored as 0-100)
- Sidebar collapse/expand fully working in both directions

**Week 9.5 (Backend Improvements — COMPLETE):**
- Upgraded scispacy model from en_core_sci_sm to en_ner_bc5cdr_md
- Updated entity_extraction.py to load new model
- Updated utils.ts to map CHEMICAL → MEDICATION and DISEASE → CONDITION
- Rewrote soap_generator.py to use Groq API (llama-3.3-70b-versatile, free tier)
- Fixed main.py import order — load_dotenv() moved to top before all local imports
- Iterated SOAP system prompt through 4 physician review cycles
- Current SOAP output rated: Structural Discipline Very High, Clinical Logic Very High, Deployment Readiness Near Production
- All backend changes committed to recent-updates branch

### Not Yet Started / In Progress

- **Week 10 (IMMEDIATE NEXT):** Frontend testing and bug fixes across all 5 test scenarios
- Week 11: Authentication (backend JWT + frontend wiring)
- Week 12: Database integration (PostgreSQL, replace localStorage history)
- Week 13: Docker containerisation
- Week 14: Testing & QA (20+ test scenarios)
- Week 15-16: Deployment (Railway backend, Vercel frontend)
- Week 17: User testing
- Week 18-19: Documentation and demo video
- Week 20: Final polish and launch

---

## 12. Week 10 Testing Plan (Immediate Next Task)

Run all 5 existing test audio scenarios through the full pipeline and check the following for each:

**Backend checks:**
- Console shows `SOAP note generated via Groq llama-3.3-70b-versatile` (not fallback)
- Entity extraction shows correct counts per category
- Content validation passes with high confidence

**Frontend checks:**
- Entity chips render with correct colours per category (CHEMICAL → blue/MEDICATION, DISEASE → purple/CONDITION)
- SOAP sections display as readable prose (not structured dicts)
- SOAPNoteCard 2x2 grid renders all four sections
- Transcription text visible in TranscriptionCard
- History entry created after each transcription
- History page shows all 5 entries searchable and filterable
- Download from History exports correct SOAP content
- Dark mode renders correctly across all pages
- Compact view reduces padding correctly
- Settings changes persist across page reload

**Content validator recalibration:**
After running all 5 scenarios, review the validation confidence scores. Current thresholds: min_density=0.10, min_markers=2. Adjust if any valid medical audio is being incorrectly rejected or if non-medical content is passing.

---

## 13. Backend Remaining Improvement Backlog

These are lower-priority improvements identified during physician review but not yet implemented. Consider for Week 14 QA phase.

### Complaint-based smart templates
For high-risk chief complaints (chest pain, dyspnoea, syncope), the system prompt already handles these fairly well. A future improvement would be to detect the chief complaint in the transcription and inject a complaint-specific checklist into the prompt dynamically. This would improve completeness for edge cases.

### Medication normalisation verification
The current system prompt instructs the model to correct phonetic medication misspellings. This works well in testing (lisinopril, atorvastatin corrected correctly). A more robust solution would be a post-processing layer that checks medication names against a formulary dictionary (RapidFuzz already installed for this purpose). Scheduled for consideration in Week 14.

### SOAP note edit persistence
Currently SOAP edits in the frontend are local React state only. Week 12 database integration should include a PATCH /api/soap/{id} endpoint to persist physician edits.

---

## 14. Resume / Portfolio Notes

When this project is complete, the student should be able to say:

"Built MediScribe AI, a full-stack medical transcription system using OpenAI Whisper for speech-to-text, scispacy (en_ner_bc5cdr_md) for medical NLP, and Groq's llama-3.3-70b-versatile for SOAP note generation. Architected a FastAPI backend processing clinical audio with sub-5-second latency. Implemented intelligent entity extraction with dynamic compound term merging across 837 medical terms. Rebuilt the frontend from scratch in React 18 + TypeScript with Zustand state management, achieving a Behance-quality clinical interface with persistent settings, dark mode, editable SOAP notes, and full transcription history. Iterated SOAP generation quality through four physician review cycles, achieving Near Production clinical documentation quality. Delivered as a containerised application deployed on Railway and Vercel."

**Key Metrics:**
- Medical term coverage: 837 terms across 7+ specialties
- Transcription latency: 3-5 seconds per minute of audio
- Entity categorisation: significantly improved with en_ner_bc5cdr_md (CHEMICAL/DISEASE labels)
- SOAP quality: Near Production per physician review (4 iteration cycles documented)
- Technologies: FastAPI, Whisper, scispacy, Groq API, React 18, TypeScript, Zustand, Tailwind CSS, shadcn/ui, PostgreSQL (planned), Docker (planned), Railway, Vercel

**Portfolio differentiator — physician review process:**
The iterative SOAP quality improvement process with real physician feedback across 4 documented cycles is a strong portfolio talking point. It demonstrates rigorous validation methodology, not just technical implementation.

---

## 15. Revised 20-Week Timeline

| Phase | Weeks | Status |
|---|---|---|
| Backend foundation | 1-2 | COMPLETE |
| Original frontend (scrapped) | 6-7 | REPLACED |
| UI/UX prototype design | 8 | COMPLETE |
| React frontend rebuild | 9 | COMPLETE |
| Backend improvements (SOAP + entities) | 9.5 | COMPLETE |
| Frontend testing and bug fixes | 10 | NEXT |
| Authentication | 11 | NOT STARTED |
| Database integration | 12 | NOT STARTED |
| Docker containerisation | 13 | NOT STARTED |
| Testing and QA | 13-14 | NOT STARTED |
| Deployment | 15-16 | NOT STARTED |
| User testing | 17 | NOT STARTED |
| Documentation and demo video | 18-19 | NOT STARTED |
| Final polish and launch | 20 | NOT STARTED |

**Current overall progress: approximately 50% complete**
**On track for May 2026 completion**

---

## 16. Instructions for Future Claude Sessions

### How to Resume Development

1. Read this entire memory file before responding to any request
2. Ask the student to paste relevant file contents before making changes — never assume what is in a file
3. Before writing code, confirm the current state matches what the memory file describes
4. All commits go to the `recent-updates` branch

### Context is Critical

- This is a 20-week educational and portfolio project
- Student has completed GRE (December 2025) and is working toward Canadian university applications
- Student understands React, TypeScript, Tailwind, and Zustand at an intermediate level after Week 9 work
- Backend is Python/FastAPI — student understands the architecture

### Student Skill Level (Updated March 2026)

- Python: Comfortable, can write and debug independently
- React + TypeScript: Intermediate — built full frontend in Week 9, understands components, hooks, props, state
- Tailwind CSS v3: Comfortable with utility classes and custom config
- Zustand: Understands store pattern, slices, persist middleware
- shadcn/ui: Knows how to use and customise components
- Git: Basic commands, uses `recent-updates` branch for all current work
- Backend: Understands FastAPI, scispacy pipeline, Groq SOAP generation
- ML/AI: Learning, improving through this project

### Student Preferences

- NO EMOJIS in code, UI, comments, or responses — use Lucide icons for UI
- Prefers detailed explanations with code examples
- Likes to understand WHY, not just HOW
- Professional tone throughout
- Motivated by seeing features work end-to-end
- Clean, maintainable code

### The 100% Free Constraint

Non-negotiable for all infrastructure. SOAP generation uses Groq free tier (14,400 requests/day, no credit card required). All other services must remain free: Codespaces, Railway free tier, Vercel free tier.

### Git Workflow

```bash
git add .
git commit -m "description"
git push
# All changes on recent-updates branch
```

### Development Environment

- Codespaces, ~15GB storage available
- Backend: `cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- Frontend: `cd frontend && npm run dev` (port 5173)
- Test backend: http://localhost:8000/docs
- Test frontend: http://localhost:5173

### Critical Reminders

1. Tailwind CSS must stay on v3 — shadcn/ui is incompatible with v4
2. Zustand store uses `partialize` to exclude non-serialisable File objects from persistence
3. Confidence score: backend returns 0-1, normalise to 0-100 on `addToHistory()`, keep as 0-100 everywhere else
4. AppPage type includes 'login' — always include it when updating types
5. Sidebar toggle is a full-width button row, NOT part of the logo row
6. All development commits to `recent-updates` branch
7. load_dotenv() in main.py MUST come before all local module imports — this caused a recurring bug in Week 9.5
8. Groq model is llama-3.3-70b-versatile — llama-3.1-70b-versatile was decommissioned
9. SOAP sections from Groq are plain prose strings; fallback sections are structured dicts — frontend handles both

---

*Last Updated: March 1, 2026*
*Session: Week 9.5 — Backend Improvements Complete*
*Changes this session: Groq SOAP generation implemented and iterated through 4 physician review cycles, en_ner_bc5cdr_md entity model upgrade, utils.ts CHEMICAL/DISEASE label mapping, main.py load_dotenv ordering fix*
*Next Session: Week 10 — Frontend testing across all 5 test scenarios, content validator recalibration*
*Active Branch: recent-updates*
*System Status: Frontend fully rebuilt (Week 9). Backend fully improved (Week 9.5). Groq SOAP generation working and physician-reviewed. Entity labels returning as CHEMICAL/DISEASE. All changes committed. Ready for Week 10 testing.*# MediScribe AI - Project Memory File

---

## 1. Project Summary

**Project Name:** MediScribe AI

**Description:** A production-ready medical transcription system that converts doctor-patient conversations into structured clinical documentation. Uses speech-to-text AI to transcribe audio, extracts medical entities (symptoms, medications, diagnoses), generates formatted SOAP notes, and provides secure multi-user access with database persistence. Reduces physician documentation time from 8 minutes to 3 minutes per patient.

**Primary Goals:**
- Build a complete portfolio project for Canadian university applications (McGill, Concordia, Windsor, Carleton) AND job applications
- Demonstrate advanced AI/ML skills with real-world healthcare application
- Create a fully functional, deployed demo accessible via public URL
- Demonstrate production engineering skills (Docker, PostgreSQL, authentication, deployment)
- Keep the entire project 100% FREE (no paid APIs or services) — SOAP generation uses Groq free tier (llama-3.3-70b-versatile), all other infrastructure is free
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
- en_ner_bc5cdr_md (v0.5.4) — Current biomedical NLP model (UPGRADED from en_core_sci_sm in Week 9.5). Returns CHEMICAL and DISEASE labels.
- SQLAlchemy — ORM for database operations (planned Week 12)
- Alembic — Database migrations (planned Week 12)
- python-jose — JWT token generation (planned Week 11)
- passlib + bcrypt — Password hashing (planned Week 11)
- groq Python SDK — For Groq SOAP generation via llama-3.3-70b-versatile (IMPLEMENTED in Week 9.5)

**Database:**
- PostgreSQL — Primary database for persistence (planned Week 12)
- Schema: users, transcriptions, medical_entities, soap_notes

**Authentication:**
- JWT (JSON Web Tokens) — Stateless authentication (planned Week 11)
- bcrypt — Secure password hashing
- Role-based access control

**Containerization:**
- Docker — Application containerisation (planned Week 13)
- docker-compose — Multi-container orchestration

**Deployment:**
- Railway — Backend + database hosting (free tier)
- Vercel — Frontend hosting (free tier)

**Development Environment:**
- GitHub Codespaces (~15GB storage available)
- VS Code in browser
- No local machine resources used

**Audio Processing:**
- ffmpeg — Audio file handling
- Whisper base model (140MB, downloaded once)

**Frontend (FULLY REBUILT - Week 9):**
- React 18 + TypeScript (.tsx files)
- Vite 7 — Build tool
- Tailwind CSS v3 (NOT v4 — shadcn compatibility requires v3)
- shadcn/ui — Base component library
- Framer Motion — Animations
- Lucide React — Icons
- Axios — HTTP client
- Zustand — State management (with persist middleware)
- Sonner — Toast notifications
- date-fns — Date formatting
- clsx + tailwind-merge + class-variance-authority — Class utilities

---

### File/Folder Structure

```
mediscribe-ai/
├── .env                          # Environment variables (NOT in Git)
├── .gitignore
├── README.md
├── backend/
│   ├── main.py                  # Main API server
│   ├── transcription.py         # Whisper transcription
│   ├── entity_extraction.py     # Medical entity extraction (upgraded model)
│   ├── medical_categories.py    # Medical term dictionaries (837 terms)
│   ├── medical_categories_backup.py
│   ├── soap_generator.py        # SOAP note generation (Groq-powered, IMPROVED)
│   ├── content_validator.py     # Medical content validation
│   ├── spell_correction.py      # DISABLED — built but not used
│   └── requirements.txt
└── frontend/                    # FULLY REBUILT in Week 9
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tsconfig.app.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── App.tsx              # Root component, dark mode, routing
        ├── main.tsx             # Entry point with Toaster
        ├── index.css            # Global styles, CSS variables, scrollbar
        ├── types/
        │   └── index.ts         # All TypeScript interfaces
        ├── lib/
        │   └── utils.ts         # cn(), getEntityCategory(), groupEntities(), formatConfidence(), etc.
        ├── services/
        │   └── api.ts           # Axios instance, transcribeAudio()
        ├── store/
        │   └── appStore.ts      # Zustand store (navigation, upload, history, settings)
        └── components/
            ├── layout/
            │   ├── Sidebar.tsx  # Collapsible nav sidebar
            │   └── TopBar.tsx   # Sticky header with page title and buttons
            └── features/
                ├── upload/
                │   ├── StatsBar.tsx        # Three stat cards (transcriptions, confidence, time saved)
                │   ├── UploadZone.tsx      # Drag-and-drop file upload area
                │   ├── UploadCard.tsx      # Wrapper card with error/success states
                │   └── TranscribeButton.tsx # Processing bar and submit button
                └── results/
                    ├── ResultsPanel.tsx    # Animated wrapper for all result cards
                    ├── TranscriptionCard.tsx # Transcription text with speaker highlighting
                    ├── EntitiesCard.tsx    # Medical entity chips grouped by category
                    ├── EntityChip.tsx      # Individual coloured entity chip
                    └── SOAPNoteCard.tsx    # 2x2 editable SOAP sections with download
        └── pages/
            ├── LoginPage.tsx    # Full login/register page (UI only, auth in Week 11)
            ├── DashboardPage.tsx
            ├── HistoryPage.tsx
            └── SettingsPage.tsx
```

---

## 3. Design System

**Approved Prototype:** mediscribe-prototype-v3.html (on file, use as reference)

**Colour Palette:**
- Primary blue: `#1A56DB`
- Accent green: `#0BA871`
- Sidebar navy: `#0D1B2A`
- Background: `#F0F4F8`
- Dark mode background: `#0F172A`
- Card white: `#FFFFFF`
- Border: `#E2E8F0`
- Muted text: `#94A3B8`

**Typography:**
- Headings: Sora (font-head)
- Body: DM Sans (font-sans)
- Monospace/data: IBM Plex Mono (font-mono)

**Entity Category Colours:**
- SYMPTOM: Red chips with red left border
- MEDICATION: Blue chips with blue left border
- CONDITION: Purple chips with purple left border
- PROCEDURE: Green chips with green left border
- TEST: Amber/orange chips with amber left border
- OTHER: Grey chips with grey left border

**Border radius:** 10px default, 14px for cards
**Sidebar widths:** 220px expanded, 60px collapsed
**TopBar height:** 54px

---

## 4. Frontend Architecture (Week 9 Complete)

### Zustand Store (`src/store/appStore.ts`)

Persisted to localStorage via `zustand/middleware/persist`. Key: `mediscribe-storage`.

**Persisted slices:**
- `history` — array of HistoryEntry objects
- `profile` — UserProfile (firstName, lastName, email, specialty, hospital, licenseNo, avatarUrl)
- `preferences` — Preferences (autoScroll, compactView, showConfidence, autoCopy, darkMode)
- `notifications` — NotificationSettings (emailNotifs, transcriptDone, weeklyReport)
- `sidebarCollapsed` — boolean

**Non-persisted (reset on reload is correct behaviour):**
- `uploadState`, `selectedFile`, `transcriptionResult`, `processingStatus`, `errorMessage`
- `currentPage` — resets to `login` on reload

**Actions:**
- `setPage(page)` — navigate between pages
- `toggleSidebar()` — collapse/expand sidebar
- `setFile(file)` — select audio file (null clears)
- `setUploadState(state)` — idle | selected | processing | done | error
- `setProcessingStatus(msg)` — update processing stage text
- `setResult(result)` — store transcription result, set state to done
- `setError(msg)` — store error, set state to error
- `clearUpload()` — reset all upload state
- `addToHistory(result, file)` — create HistoryEntry and prepend to history array
- `deleteHistoryItem(id)` — remove by id
- `clearHistory()` — empty array
- `updateProfile(partial)` — merge into profile
- `updatePreferences(partial)` — merge into preferences (darkMode triggers useEffect in App.tsx)
- `updateNotifications(partial)` — merge into notifications

### TypeScript Types (`src/types/index.ts`)

```typescript
MedicalEntity        { text, label, confidence, start, end }
SOAPNote             { subjective, objective, assessment, plan }
TranscriptionResult  { transcription, entities, soap_note, confidence_score }
EntityCategory       'SYMPTOM' | 'MEDICATION' | 'CONDITION' | 'PROCEDURE' | 'TEST' | 'OTHER'
GroupedEntities      { symptoms, medications, conditions, procedures, tests, other }
HistoryEntry         { id, date, patientId, duration, entityCount, confidenceScore, status, result }
UploadState          'idle' | 'selected' | 'processing' | 'done' | 'error'
AppPage              'login' | 'dashboard' | 'history' | 'settings'
UserProfile          { firstName, lastName, email, specialty, hospital, licenseNo, avatarUrl }
Preferences          { autoScroll, compactView, showConfidence, autoCopy, darkMode }
NotificationSettings { emailNotifs, transcriptDone, weeklyReport }
```

### Utility Functions (`src/lib/utils.ts`)

- `cn(...inputs)` — Tailwind class merging with clsx + tailwind-merge
- `getEntityCategory(label, text?)` — Maps to EntityCategory. Now handles CHEMICAL → MEDICATION and DISEASE → CONDITION (from en_ner_bc5cdr_md). Keyword matching retained as fallback for any remaining generic labels.
- `groupEntities(entities)` — Groups flat entity array into GroupedEntities buckets
- `formatConfidence(score)` — Converts 0-1 or 0-100 to percentage string
- `getEntityStyles(category)` — Returns { bg, border, text, dot } Tailwind classes per category
- `generatePatientId()` — Returns random PT-##### string
- `formatDate(date)` — Returns "Feb 20, 2026 · 9:14 AM"

**IMPORTANT — utils.ts change made in Week 9.5:**
`getEntityCategory()` now includes these two cases before the keyword fallback:
```typescript
if (l === 'CHEMICAL') return 'MEDICATION'
if (l === 'DISEASE')  return 'CONDITION'
```

### API Service (`src/services/api.ts`)

- Base URL: `import.meta.env.VITE_API_URL || 'http://localhost:8000'`
- Timeout: 120 seconds
- `transcribeAudio(file: File)` — POST multipart/form-data to `/api/transcribe`
- Returns `TranscriptionResult`

### Routing

Handled by Zustand `currentPage` state, not React Router. App.tsx conditionally renders pages. Login page renders full-screen with no sidebar/topbar.

---

## 5. Pages — Current State

### LoginPage (`src/pages/LoginPage.tsx`)
**Status:** UI complete, authentication is mock/simulated only.

- Two-panel layout: left navy panel (hidden on mobile) with branding, stats, testimonial; right panel with form
- Modes: login and register (toggle with link)
- Login fields: email, password (with show/hide toggle), remember me checkbox, forgot password link
- Register fields: additionally firstName, lastName, specialty
- Submit: 1.2 second simulated delay, success toast, redirects to dashboard after 600ms
- Google SSO button: shows info toast ("coming in Week 11")
- Forgot password: shows info toast ("coming in Week 11")
- Sign Out in sidebar: navigates back to login page

**IMPORTANT:** No real authentication exists. Any email/password combination works. Real auth is Week 11.

### DashboardPage (`src/pages/DashboardPage.tsx`)
- StatsBar: three cards (Total Transcriptions, Avg Confidence, Time Saved) — all live from Zustand history
- UploadCard: wraps UploadZone + TranscribeButton + error/success banners
- ResultsPanel: appears after transcription, three stacked cards

**Upload flow:**
1. UploadZone: idle state shows drag-drop area; selected state shows green file card with fake audio player
2. TranscribeButton: appears when file is selected; animates fake progress bar through 5 stages while API call runs; real progress completes at 100% then short pause before results appear
3. ResultsPanel: auto-scrolls into view (if autoScroll preference is on); three cards stacked vertically

**Preferences that affect Dashboard:**
- `autoScroll` — controls whether ResultsPanel scrolls into view
- `showConfidence` — shows/hides confidence bar in TranscriptionCard
- `autoCopy` — auto-copies transcription text to clipboard on completion
- `compactView` — reduces padding on all three result cards

### HistoryPage (`src/pages/HistoryPage.tsx`)
- Search input: filters by patientId or date string
- Confidence filter dropdown: All / High (>=80%) / Medium (60-80%) / Low (<60%)
- Delete All button: opens confirmation modal showing count, requires second click
- Empty state: shown when history is empty with "Start a Transcription" button
- No results state: shown when search/filter returns nothing, with "Clear filters" link
- Table columns: Date & Time, Patient ID, Entities, Confidence (colour-coded badge), Status, Actions
- Row actions: View (loads result onto dashboard), Download (exports SOAP as .txt), Delete (removes entry with toast)
- Footer: shows "Showing X of Y transcriptions"
- Confidence stored as 0-100 number (normalised on addToHistory, not on display)

### SettingsPage (`src/pages/SettingsPage.tsx`)
Two-column layout: left tab nav, right content panel.

**Profile tab:**
- Avatar circle with initials or uploaded photo preview
- Camera icon and "Change photo" link both trigger hidden file input
- File validation: JPG/PNG/WebP/GIF only, max 2MB
- Photo stored as base64 dataURL in Zustand profile.avatarUrl
- Form fields: First Name, Last Name, Email, Specialty, Hospital, Medical License No.
- Draft state: edits are local until "Save Changes" is clicked (commits to Zustand)
- "Discard" resets draft to last saved state
- All changes persist across page navigation and browser reload (Zustand persist)

**Preferences tab:**
All toggles write directly to Zustand `preferences` and persist immediately.
- Dark Mode — applies `dark` class to `<html>` via useEffect in App.tsx
- Auto-scroll to Results — controls ResultsPanel scroll behaviour
- Compact View — reduces padding on result cards (prop passed down)
- Show Confidence Score — shows/hides confidence strip in TranscriptionCard
- Auto-copy Transcription — auto-copies text to clipboard on transcription completion

**Notifications tab:**
All toggles write directly to Zustand `notifications` and persist.
- Email Notifications — UI only, no backend email service exists yet
- Weekly Usage Report — UI only, same reason
- Transcription Complete — when OFF, suppresses the Sonner success toast after transcription finishes

**API & Integrations tab:**
- Backend URL display (static, not editable yet)
- Green "connected" status indicator with pulse animation
- Endpoint reference table (POST /api/transcribe, GET /api/health, POST /api/validate)

**Danger Zone tab:**
- Clear Transcription History button (disabled when history is empty) — opens confirmation modal
- Reset All Settings button — resets preferences and notifications to defaults, shows info toast

### Sidebar (`src/components/layout/Sidebar.tsx`)
- Fixed left, 220px expanded / 60px collapsed
- Dark navy (`#0D1B2A`) background
- Logo row: gradient Zap icon + "MediScribe AI" text + "Clinical" subtext
- Toggle button: its own full-width row between logo and nav. When collapsed: centred ChevronRight icon. When expanded: "Collapse" text + ChevronLeft icon aligned right.
- Nav sections: WORKSPACE (Dashboard, History with badge count), ACCOUNT (Settings, Sign Out)
- Sign Out navigates to login page
- Tooltips appear on hover when collapsed
- User pill at bottom: avatar with initials (or photo from profile), name, role
- Smooth 240ms transitions

### TopBar (`src/components/layout/TopBar.tsx`)
- Sticky, 54px height, white background
- Page title (dynamic from currentPage)
- Date (font-mono, hidden on small screens)
- Alerts button (ghost style, visible border and text)
- New Transcription button (primary blue, only shown when NOT on dashboard — navigates to dashboard)

---

## 6. Backend — Current State (Updated Week 9.5)

**Files:**
- `backend/main.py` — FastAPI app, CORS, `/api/transcribe` endpoint
- `backend/transcription.py` — Whisper transcription
- `backend/entity_extraction.py` — scispacy entity extraction (now uses en_ner_bc5cdr_md)
- `backend/medical_categories.py` — 837 term medical dictionary
- `backend/soap_generator.py` — Groq-powered SOAP generation with rule-based fallback (FULLY REWRITTEN Week 9.5)
- `backend/content_validator.py` — Medical content density validation
- `backend/spell_correction.py` — DISABLED, built with RapidFuzz

### SOAP Generation — Groq Implementation (Week 9.5)

**Model:** `llama-3.3-70b-versatile` via Groq API (free tier)
**SDK:** `groq>=0.9.0`
**Key:** `GROQ_API_KEY` in `.env`
**Fallback:** Rule-based generation runs automatically if Groq call fails for any reason

**Critical implementation note — main.py import order:**
`load_dotenv()` MUST be called before any local module imports. The correct order at the top of `main.py` is:
```python
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, ...
from soap_generator import generate_soap_note, format_soap_note_text
from entity_extraction import extract_medical_entities
# etc.
```
If `load_dotenv()` comes after the local imports, `os.getenv("GROQ_API_KEY")` returns None when soap_generator initialises and every request falls back to rule-based generation.

**SOAP generation philosophy — Documentation Enhancer:**
The system operates as a documentation enhancer, not a pure transcription structurer. It adds standard-of-care items clinically implied by the presentation (cardiac monitoring, IV access, serial ECGs, troponins, NPO status, etc.) even if not explicitly spoken, stating them as direct actions without labelling them as "protocol."

**Current system prompt covers:**
- Strict SOAP section boundaries — zero diagnostic interpretation in Subjective or Objective
- OPQRST structure written as fluent clinical prose (not mechanical labelled lines)
- Missing data transparency — "not documented in transcript" for absent data points
- Medication name normalisation — corrects phonetic misspellings to formulary standard (e.g. "lysinoprell" → lisinopril, "adervastatin" → atorvastatin)
- Numbered problem-based Assessment with precision language ("highly concerning for", "likely", "consistent with")
- Strict diagnostic taxonomy — subtypes never listed parallel to parent category (e.g. STEMI/NSTEMI/UA listed as subtypes of ACS, not alongside it)
- Differential diagnosis using "less likely given current symptom description" — never implies exclusion based on absence of documentation
- Expanded Plan with standard-of-care items stated as direct actions
- Patient counselling, disposition, and urgency classification included when relevant

**SOAP note quality — physician review history:**
This system prompt has been through four iterative review cycles with a real physician:
- Review 1: Identified poor SOAP boundaries, no clinical prose, rule-based output
- Review 2: Structural improvement confirmed, requested OPQRST scaffolding and missing-data transparency
- Review 3: Rated "Near Production" — requested medication normalisation, removal of "per standard protocol" labelling, differential safety language fix
- Review 4 (current): Rated "Near Production / Very High on clinical logic" — remaining refinements are minor. Current prompt addresses all four review cycles.

**Doctor's final assessment of current output:**
"Structural Discipline: Very High, Clinical Logic: Very High, Documentation Completeness: High, Professional Authenticity: Moderate-High, Deployment Readiness: Near Production"

### Entity Extraction — Upgraded Model (Week 9.5)

**Previous model:** `en_core_sci_sm` — returned generic `ENTITY` label for all entities
**Current model:** `en_ner_bc5cdr_md` — returns `CHEMICAL` (medications) and `DISEASE` (conditions)

**Install command used:**
```bash
pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_bc5cdr_md-0.5.4.tar.gz --break-system-packages
```

**Frontend change made in utils.ts:**
```typescript
if (l === 'CHEMICAL') return 'MEDICATION'
if (l === 'DISEASE')  return 'CONDITION'
```
These two cases were added before the keyword fallback in `getEntityCategory()`.

### Content Validation — No Changes Yet

The 10% medical term density minimum and 2 clinical markers minimum were kept unchanged in Week 9.5. These thresholds are independent of the scispacy model and the Groq layer — the validator runs on raw Whisper transcription text using its own dictionary-based density calculation. Recalibration is scheduled for Week 10 after running all 5 test scenarios through the full pipeline.

### requirements.txt — Current State

```
fastapi==0.104.1
uvicorn==0.24.0
python-multipart==0.0.6
websockets==12.0
python-dotenv==1.0.0
groq>=0.9.0
openai-whisper
scispacy
spacy
https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_bc5cdr_md-0.5.4.tar.gz
rapidfuzz==3.6.1
```

---

## 7. API Response Structure

**Current backend response from `/api/transcribe`:**
```json
{
  "success": true,
  "transcription": "Patient is a 52-year old male...",
  "entities": [
    {
      "text": "chest pain",
      "label": "DISEASE",
      "start": 0,
      "end": 10,
      "confidence": 0.95
    }
  ],
  "soap_note": {
    "subjective": "...",
    "objective": "...",
    "assessment": "...",
    "plan": "..."
  },
  "confidence_score": 0.86
}
```

**Note on entity labels:** Entity labels now return as `CHEMICAL` or `DISEASE` from en_ner_bc5cdr_md. The frontend `getEntityCategory()` maps these to MEDICATION and CONDITION respectively. Some entities may still return generic labels depending on what the model recognises — the keyword fallback handles those.

**IMPORTANT — confidence_score format:**
Backend returns `confidence_score` as a decimal between 0 and 1 (e.g. 0.86).
Frontend normalises this to 0-100 at the point of `addToHistory()` in the Zustand store.
The `formatConfidence()` utility handles both 0-1 and 0-100 inputs for display.
The History page stores and reads the 0-100 normalised value.

**SOAP note shape — dual format:**
The Groq path returns SOAP sections as plain prose strings. The fallback path returns structured dicts. The frontend SOAPNoteCard and format_soap_note_text() handle both shapes. The `source` field in the response indicates which path ran: `"groq-llama-3.3-70b-versatile"` or `"rule-based-fallback"`.

---

## 8. Preferences and Their Effects

| Preference | Where it takes effect |
|---|---|
| darkMode | App.tsx useEffect adds/removes `dark` class on `<html>` |
| autoScroll | ResultsPanel.tsx useEffect — scrollIntoView on results appear |
| compactView | ResultsPanel passes `compact` prop to all three result cards, reducing padding |
| showConfidence | TranscriptionCard.tsx — hides/shows confidence strip section |
| autoCopy | TranscriptionCard.tsx useEffect — auto-copies to clipboard when transcription loads |
| transcriptDone | TranscribeButton.tsx — conditionally calls `toast.success()` after completion |
| emailNotifs | UI only — no backend email service, noted for backlog |
| weeklyReport | UI only — no backend, noted for backlog |

---

## 9. Known Frontend Limitations and Notes

**Entity colour coding:**
The frontend `getEntityCategory()` now correctly maps CHEMICAL → MEDICATION and DISEASE → CONDITION from the upgraded scispacy model. Keyword fallback is retained for any entities the model labels generically. Coverage should be significantly better than the old en_core_sci_sm model.

**Login is UI-only:**
Any email/password combination logs in. No token is stored, no session persists across reload (reload returns to login screen, which is correct for now). Real auth, JWT, protected routes are all Week 11.

**History is in-memory (Zustand + localStorage):**
History persists across browser sessions via Zustand persist middleware. It will be replaced with real PostgreSQL persistence in Week 12. Clearing localStorage clears all history.

**Profile photo:**
Stored as base64 dataURL in Zustand/localStorage. This is fine for a prototype but will hit localStorage limits with large images. Week 12 database integration should move this to server-side storage.

**Email and weekly report notifications:**
Toggling these in Settings has no effect beyond the UI state persisting. Actual email sending requires a backend email service (SendGrid, SMTP, etc.) which is not yet implemented.

**SOAP note editing:**
The SOAP note card uses textarea elements that allow the user to edit the content. These edits are stored in local React state only and are NOT persisted. Refreshing the page or loading a new transcription discards edits. Week 12 database integration should add a save-edits endpoint.

---

## 10. Development Commands

```bash
# Backend (run from /workspaces/mediscribe-ai/backend/)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (run from /workspaces/mediscribe-ai/frontend/)
npm run dev
# Runs at http://localhost:5173

# Git (run from /workspaces/mediscribe-ai/)
git add .
git commit -m "description"
git push
# All changes go to the recent-updates branch
```

**Branch note:** All development happens on `recent-updates` branch. The `main` branch has the old frontend. When the new frontend is ready to merge, the old `frontend/` folder must be deleted from main first.

---

## 11. Progress Snapshot — As of March 1, 2026

### Completed

**Weeks 1-2 (Backend Foundation):**
- FastAPI server, Whisper transcription, scispacy entity extraction
- Entity categorisation with 700+ term dictionary (now 837 terms)
- Smart entity merging (dynamic, data-driven)
- Content validation system

**Weeks 6-7 (Original Frontend — Scrapped):**
- Basic React + JSX frontend (deleted, replaced in Week 9)

**Week 8 (UI/UX Design):**
- Created interactive HTML prototype (v1, v2, v3)
- Finalised design system: blue/navy/green palette, Sora/DM Sans/IBM Plex Mono fonts
- Approved v3 prototype as reference for React build

**Week 9 (React Frontend Rebuild — COMPLETE):**
- Fresh Vite + React 18 + TypeScript project
- Tailwind CSS v3 with custom design tokens
- shadcn/ui base components
- Full type system (src/types/index.ts)
- Utility functions (src/lib/utils.ts)
- Axios API service (src/services/api.ts)
- Zustand store with persist middleware (src/store/appStore.ts)
- Sidebar with collapse/expand (with always-visible toggle button)
- TopBar with dynamic title and action buttons
- App.tsx shell with dark mode, routing, margin transitions
- Dashboard: StatsBar + UploadCard + ResultsPanel
  - Drag-drop upload zone
  - File selected state with audio player UI
  - Fake progress bar through 5 processing stages
  - TranscriptionCard with speaker highlighting and copy button
  - EntitiesCard with category-grouped colour chips
  - SOAPNoteCard with 2x2 editable grid, copy all, download
- History page: search, confidence filter, sortable table, view/download/delete actions, Delete All modal
- Settings page: Profile (with real photo upload), Preferences (all wired), Notifications, API tab, Danger Zone
- Login page: left branding panel + right form, login/register modes, show/hide password
- All preferences functional and persisted
- Dark mode working (html class toggle)
- Confidence score normalisation fixed (backend 0-1 → stored as 0-100)
- Sidebar collapse/expand fully working in both directions

**Week 9.5 (Backend Improvements — COMPLETE):**
- Upgraded scispacy model from en_core_sci_sm to en_ner_bc5cdr_md
- Updated entity_extraction.py to load new model
- Updated utils.ts to map CHEMICAL → MEDICATION and DISEASE → CONDITION
- Rewrote soap_generator.py to use Groq API (llama-3.3-70b-versatile, free tier)
- Fixed main.py import order — load_dotenv() moved to top before all local imports
- Iterated SOAP system prompt through 4 physician review cycles
- Current SOAP output rated: Structural Discipline Very High, Clinical Logic Very High, Deployment Readiness Near Production
- All backend changes committed to recent-updates branch

### Not Yet Started / In Progress

- **Week 10 (IMMEDIATE NEXT):** Frontend testing and bug fixes across all 5 test scenarios
- Week 11: Authentication (backend JWT + frontend wiring)
- Week 12: Database integration (PostgreSQL, replace localStorage history)
- Week 13: Docker containerisation
- Week 14: Testing & QA (20+ test scenarios)
- Week 15-16: Deployment (Railway backend, Vercel frontend)
- Week 17: User testing
- Week 18-19: Documentation and demo video
- Week 20: Final polish and launch

---

## 12. Week 10 Testing Plan (Immediate Next Task)

Run all 5 existing test audio scenarios through the full pipeline and check the following for each:

**Backend checks:**
- Console shows `SOAP note generated via Groq llama-3.3-70b-versatile` (not fallback)
- Entity extraction shows correct counts per category
- Content validation passes with high confidence

**Frontend checks:**
- Entity chips render with correct colours per category (CHEMICAL → blue/MEDICATION, DISEASE → purple/CONDITION)
- SOAP sections display as readable prose (not structured dicts)
- SOAPNoteCard 2x2 grid renders all four sections
- Transcription text visible in TranscriptionCard
- History entry created after each transcription
- History page shows all 5 entries searchable and filterable
- Download from History exports correct SOAP content
- Dark mode renders correctly across all pages
- Compact view reduces padding correctly
- Settings changes persist across page reload

**Content validator recalibration:**
After running all 5 scenarios, review the validation confidence scores. Current thresholds: min_density=0.10, min_markers=2. Adjust if any valid medical audio is being incorrectly rejected or if non-medical content is passing.

---

## 13. Backend Remaining Improvement Backlog

These are lower-priority improvements identified during physician review but not yet implemented. Consider for Week 14 QA phase.

### Complaint-based smart templates
For high-risk chief complaints (chest pain, dyspnoea, syncope), the system prompt already handles these fairly well. A future improvement would be to detect the chief complaint in the transcription and inject a complaint-specific checklist into the prompt dynamically. This would improve completeness for edge cases.

### Medication normalisation verification
The current system prompt instructs the model to correct phonetic medication misspellings. This works well in testing (lisinopril, atorvastatin corrected correctly). A more robust solution would be a post-processing layer that checks medication names against a formulary dictionary (RapidFuzz already installed for this purpose). Scheduled for consideration in Week 14.

### SOAP note edit persistence
Currently SOAP edits in the frontend are local React state only. Week 12 database integration should include a PATCH /api/soap/{id} endpoint to persist physician edits.

---

## 14. Resume / Portfolio Notes

When this project is complete, the student should be able to say:

"Built MediScribe AI, a full-stack medical transcription system using OpenAI Whisper for speech-to-text, scispacy (en_ner_bc5cdr_md) for medical NLP, and Groq's llama-3.3-70b-versatile for SOAP note generation. Architected a FastAPI backend processing clinical audio with sub-5-second latency. Implemented intelligent entity extraction with dynamic compound term merging across 837 medical terms. Rebuilt the frontend from scratch in React 18 + TypeScript with Zustand state management, achieving a Behance-quality clinical interface with persistent settings, dark mode, editable SOAP notes, and full transcription history. Iterated SOAP generation quality through four physician review cycles, achieving Near Production clinical documentation quality. Delivered as a containerised application deployed on Railway and Vercel."

**Key Metrics:**
- Medical term coverage: 837 terms across 7+ specialties
- Transcription latency: 3-5 seconds per minute of audio
- Entity categorisation: significantly improved with en_ner_bc5cdr_md (CHEMICAL/DISEASE labels)
- SOAP quality: Near Production per physician review (4 iteration cycles documented)
- Technologies: FastAPI, Whisper, scispacy, Groq API, React 18, TypeScript, Zustand, Tailwind CSS, shadcn/ui, PostgreSQL (planned), Docker (planned), Railway, Vercel

**Portfolio differentiator — physician review process:**
The iterative SOAP quality improvement process with real physician feedback across 4 documented cycles is a strong portfolio talking point. It demonstrates rigorous validation methodology, not just technical implementation.

---

## 15. Revised 20-Week Timeline

| Phase | Weeks | Status |
|---|---|---|
| Backend foundation | 1-2 | COMPLETE |
| Original frontend (scrapped) | 6-7 | REPLACED |
| UI/UX prototype design | 8 | COMPLETE |
| React frontend rebuild | 9 | COMPLETE |
| Backend improvements (SOAP + entities) | 9.5 | COMPLETE |
| Frontend testing and bug fixes | 10 | NEXT |
| Authentication | 11 | NOT STARTED |
| Database integration | 12 | NOT STARTED |
| Docker containerisation | 13 | NOT STARTED |
| Testing and QA | 13-14 | NOT STARTED |
| Deployment | 15-16 | NOT STARTED |
| User testing | 17 | NOT STARTED |
| Documentation and demo video | 18-19 | NOT STARTED |
| Final polish and launch | 20 | NOT STARTED |

**Current overall progress: approximately 50% complete**
**On track for May 2026 completion**

---

## 16. Instructions for Future Claude Sessions

### How to Resume Development

1. Read this entire memory file before responding to any request
2. Ask the student to paste relevant file contents before making changes — never assume what is in a file
3. Before writing code, confirm the current state matches what the memory file describes
4. All commits go to the `recent-updates` branch

### Context is Critical

- This is a 20-week educational and portfolio project
- Student has completed GRE (December 2025) and is working toward Canadian university applications
- Student understands React, TypeScript, Tailwind, and Zustand at an intermediate level after Week 9 work
- Backend is Python/FastAPI — student understands the architecture

### Student Skill Level (Updated March 2026)

- Python: Comfortable, can write and debug independently
- React + TypeScript: Intermediate — built full frontend in Week 9, understands components, hooks, props, state
- Tailwind CSS v3: Comfortable with utility classes and custom config
- Zustand: Understands store pattern, slices, persist middleware
- shadcn/ui: Knows how to use and customise components
- Git: Basic commands, uses `recent-updates` branch for all current work
- Backend: Understands FastAPI, scispacy pipeline, Groq SOAP generation
- ML/AI: Learning, improving through this project

### Student Preferences

- NO EMOJIS in code, UI, comments, or responses — use Lucide icons for UI
- Prefers detailed explanations with code examples
- Likes to understand WHY, not just HOW
- Professional tone throughout
- Motivated by seeing features work end-to-end
- Clean, maintainable code

### The 100% Free Constraint

Non-negotiable for all infrastructure. SOAP generation uses Groq free tier (14,400 requests/day, no credit card required). All other services must remain free: Codespaces, Railway free tier, Vercel free tier.

### Git Workflow

```bash
git add .
git commit -m "description"
git push
# All changes on recent-updates branch
```

### Development Environment

- Codespaces, ~15GB storage available
- Backend: `cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- Frontend: `cd frontend && npm run dev` (port 5173)
- Test backend: http://localhost:8000/docs
- Test frontend: http://localhost:5173

### Critical Reminders

1. Tailwind CSS must stay on v3 — shadcn/ui is incompatible with v4
2. Zustand store uses `partialize` to exclude non-serialisable File objects from persistence
3. Confidence score: backend returns 0-1, normalise to 0-100 on `addToHistory()`, keep as 0-100 everywhere else
4. AppPage type includes 'login' — always include it when updating types
5. Sidebar toggle is a full-width button row, NOT part of the logo row
6. All development commits to `recent-updates` branch
7. load_dotenv() in main.py MUST come before all local module imports — this caused a recurring bug in Week 9.5
8. Groq model is llama-3.3-70b-versatile — llama-3.1-70b-versatile was decommissioned
9. SOAP sections from Groq are plain prose strings; fallback sections are structured dicts — frontend handles both

---

*Last Updated: March 1, 2026*
*Session: Week 9.5 — Backend Improvements Complete*
*Changes this session: Groq SOAP generation implemented and iterated through 4 physician review cycles, en_ner_bc5cdr_md entity model upgrade, utils.ts CHEMICAL/DISEASE label mapping, main.py load_dotenv ordering fix*
*Next Session: Week 10 — Frontend testing across all 5 test scenarios, content validator recalibration*
*Active Branch: recent-updates*
*System Status: Frontend fully rebuilt (Week 9). Backend fully improved (Week 9.5). Groq SOAP generation working and physician-reviewed. Entity labels returning as CHEMICAL/DISEASE. All changes committed. Ready for Week 10 testing.*