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
- Keep the entire project 100% FREE (no paid APIs or services) — NOTE: OpenAI API key is now available for SOAP generation only (very low cost, under $0.01 per transcript)
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
- en_core_sci_sm (v0.5.4) — Current biomedical NLP model (upgrade planned, see Section 17)
- SQLAlchemy — ORM for database operations (planned Week 12)
- Alembic — Database migrations (planned Week 12)
- python-jose — JWT token generation (planned Week 11)
- passlib + bcrypt — Password hashing (planned Week 11)
- openai Python SDK — For GPT-4o-mini SOAP generation (PENDING implementation, see Section 17)

**Database:**
- PostgreSQL — Primary database for persistence (planned Week 12)
- Schema: users, transcriptions, medical_entities, soap_notes

**Authentication:**
- JWT (JSON Web Tokens) — Stateless authentication (planned Week 11)
- bcrypt — Secure password hashing
- Role-based access control

**Containerization:**
- Docker — Application containerization (planned Week 13)
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
│   ├── entity_extraction.py     # Medical entity extraction
│   ├── medical_categories.py    # Medical term dictionaries (700+ terms)
│   ├── medical_categories_backup.py
│   ├── soap_generator.py        # SOAP note generation (needs improvement)
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
- `getEntityCategory(label, text?)` — Maps to EntityCategory. Since backend returns generic "ENTITY" label for all entities, this function uses keyword matching on entity text as a fallback. Will auto-upgrade when backend returns specific labels.
- `groupEntities(entities)` — Groups flat entity array into GroupedEntities buckets
- `formatConfidence(score)` — Converts 0-1 or 0-100 to percentage string
- `getEntityStyles(category)` — Returns { bg, border, text, dot } Tailwind classes per category
- `generatePatientId()` — Returns random PT-##### string
- `formatDate(date)` — Returns "Feb 20, 2026 · 9:14 AM"

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
- Email Notifications — UI only, no backend email service exists yet (noted for backend backlog)
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

## 6. Backend — Current State

**Files:**
- `backend/main.py` — FastAPI app, CORS, `/api/transcribe` endpoint
- `backend/transcription.py` — Whisper transcription
- `backend/entity_extraction.py` — scispacy entity extraction
- `backend/medical_categories.py` — 700+ term medical dictionary
- `backend/soap_generator.py` — Rule-based SOAP generation (NEEDS IMPROVEMENT)
- `backend/content_validator.py` — Medical content density validation
- `backend/spell_correction.py` — DISABLED, built with RapidFuzz

**Known backend limitations (scheduled for improvement):**

### Issue 1 — All entity labels return as "ENTITY"
The current `en_core_sci_sm` model identifies medical spans but assigns them all the generic label `"ENTITY"` rather than specific types. The frontend compensates with keyword matching in `getEntityCategory()` but this is imperfect.

**Planned fix:** Upgrade scispacy model to `en_ner_bc5cdr_md` which returns `CHEMICAL` and `DISEASE` labels, or `en_ner_jnlpba_md` which returns `DNA`, `PROTEIN`, `CELL_TYPE`, etc. This will allow the frontend colour coding to work from real backend labels.

**Installation when ready:**
```bash
pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_bc5cdr_md-0.5.4.tar.gz
```

Then update `entity_extraction.py` to load `en_ner_bc5cdr_md` and update `getEntityCategory()` in `src/lib/utils.ts` to map `CHEMICAL` → MEDICATION and `DISEASE` → CONDITION.

### Issue 2 — SOAP note quality is poor
Current `soap_generator.py` is rule-based and produces low-quality output. Observed problems:
- Raw entity lists are dumped into sections instead of being synthesised into clinical prose
- Full transcription text is pasted verbatim into the Subjective section
- Duplicate content appears across multiple sections
- No clinical reasoning or natural language structure

**Example of expected quality (from real test):**
```
S — Subjective
52-year-old male presenting for follow-up of Type 2 diabetes mellitus (diagnosed 6 months ago).
Reports: increased thirst (polydipsia), frequent urination (polyuria), fatigue, blurred vision.
Home blood glucose readings 200–250 mg/dL over the past month.

O — Objective
HbA1c: 9.2% (elevated)
Comprehensive Metabolic Panel: Ordered (results pending)
Lipid Panel: Ordered (results pending)
Physical exam unremarkable.

A — Assessment
Poorly controlled Type 2 Diabetes Mellitus with symptomatic hyperglycemia.

P — Plan
Increase Metformin to 1000mg twice daily.
Initiate Insulin Glargine 10 units subcutaneously at bedtime.
Education on blood glucose monitoring.
Referral to Ophthalmology for diabetic retinopathy screening.
Follow-up in 3 months.
```

**Planned fix:** Replace `soap_generator.py` with GPT-4o-mini via OpenAI API.

Student has an OpenAI API key available. Cost per transcript is under $0.01 using `gpt-4o-mini`.

Implementation plan:
1. Add `openai` to `requirements.txt`
2. Add `OPENAI_API_KEY` to `.env`
3. Rewrite `soap_generator.py` to:
   - Accept transcription text + extracted entities as input
   - Send a structured clinical prompt to `gpt-4o-mini`
   - Parse and return the structured SOAP sections
4. Add error fallback to rule-based generation if API call fails

Prompt structure to use:
```python
system_prompt = """You are a clinical documentation assistant. Generate a structured SOAP note
from the provided doctor-patient conversation transcript and extracted medical entities.
Format the output as JSON with keys: subjective, objective, assessment, plan.
Each value should be a well-written clinical paragraph, not a bullet list of raw terms.
Be concise and clinically accurate."""

user_prompt = f"""
Transcript:
{transcription}

Extracted entities:
{entities_summary}

Generate a SOAP note in JSON format.
"""
```

### Issue 3 — Content validation thresholds may need recalibration
The 10% medical term density minimum and 2 clinical markers minimum were calibrated on early test data. Once entity extraction and SOAP generation are improved, revisit these thresholds.

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
      "label": "ENTITY",
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

**IMPORTANT — confidence_score format:**
Backend returns `confidence_score` as a decimal between 0 and 1 (e.g. 0.86).
Frontend normalises this to 0-100 at the point of `addToHistory()` in the Zustand store.
The `formatConfidence()` utility handles both 0-1 and 0-100 inputs for display.
The History page stores and reads the 0-100 normalised value.

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
The frontend `getEntityCategory()` uses keyword matching on entity text because the backend returns `"ENTITY"` for all labels. This works reasonably well but is imperfect — some entities still fall into OTHER. The definitive fix is backend-side (upgrading scispacy model). The frontend keyword list is extensive but will always be incomplete.

**Login is UI-only:**
Any email/password combination logs in. No token is stored, no session persists across reload (reload returns to login screen, which is correct for now). Real auth, JWT, protected routes are all Week 11.

**History is in-memory (Zustand + localStorage):**
History persists across browser sessions via Zustand persist middleware. It will be replaced with real PostgreSQL persistence in Week 12. Clearing localStorage clears all history.

**Profile photo:**
Stored as base64 dataURL in Zustand/localStorage. This is fine for a prototype but will hit localStorage limits with large images. Week 12 database integration should move this to server-side storage.

**Email and weekly report notifications:**
Toggling these in Settings has no effect beyond the UI state persisting. Actual email sending requires a backend email service (SendGrid, SMTP, etc.) which is not yet implemented.

**SOAP note editing:**
The SOAP note card uses `<textarea>` elements that allow the user to edit the content. These edits are stored in local React state only and are NOT persisted. Refreshing the page or loading a new transcription discards edits. Week 12 database integration should add a save-edits endpoint.

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

## 11. Progress Snapshot — As of February 27, 2026

### Completed

**Weeks 1-2 (Backend Foundation):**
- FastAPI server, Whisper transcription, scispacy entity extraction
- Entity categorisation with 700+ term dictionary
- Smart entity merging (dynamic, data-driven)
- SOAP note generation (rule-based, needs improvement)
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

### Not Yet Started

- Week 10: Testing and bug fixes across full frontend
- Week 11: Authentication (backend JWT + frontend wiring)
- Week 12: Database integration (PostgreSQL, replace localStorage history)
- Week 13: Docker containerisation
- Week 14: Testing & QA (20+ test scenarios)
- Week 15-16: Deployment (Railway backend, Vercel frontend)
- Week 17: User testing
- Week 18-19: Documentation and demo video
- Week 20: Final polish and launch

### Backend Improvements (Pending — Do Before Week 10 Testing)

- Upgrade scispacy model from `en_core_sci_sm` to `en_ner_bc5cdr_md` for specific entity labels
- Rewrite `soap_generator.py` using GPT-4o-mini via OpenAI API
- Recalibrate content validation thresholds after above changes

---

## 12. Instructions for Future Claude Sessions

### Context is Critical

- This is a 20-week educational and portfolio project
- Student has completed GRE (December 2025) and is working toward Canadian university applications
- Student understands React, TypeScript, Tailwind, and Zustand at an intermediate level after Week 9 work
- Backend is Python/FastAPI — student understands the architecture

### Student Skill Level (Updated February 2026)

- Python: Comfortable, can write and debug independently
- React + TypeScript: Intermediate — built full frontend in Week 9, understands components, hooks, props, state
- Tailwind CSS v3: Comfortable with utility classes and custom config
- Zustand: Understands store pattern, slices, persist middleware
- shadcn/ui: Knows how to use and customise components
- Git: Basic commands, uses `recent-updates` branch for all current work
- Backend: Understands FastAPI, scispacy pipeline, SOAP generation
- ML/AI: Learning, improving through this project

### Student Preferences

- NO EMOJIS in code, UI, comments, or responses
- Prefers detailed explanations with code examples
- Likes to understand WHY, not just HOW
- Professional tone throughout
- Motivated by seeing features work end-to-end
- Clean, maintainable code

### The 100% Free Constraint

Originally non-negotiable, but student now has an OpenAI API key which can be used for SOAP generation (GPT-4o-mini). Cost is under $0.01 per transcript. All other infrastructure must remain free.

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

---

## 13. Backend Improvement Backlog (Prioritised)

To be worked on after Week 9 frontend is committed and before Week 10 testing begins.

### Priority 1 — SOAP Note Quality (Highest Impact)

**Problem:** Current rule-based `soap_generator.py` produces poor output — raw entity lists, duplicate content, no clinical prose.

**Solution:** Rewrite using GPT-4o-mini via OpenAI API.

**Steps:**
1. Add `openai` to `backend/requirements.txt`
2. Add `OPENAI_API_KEY=sk-...` to `.env`
3. Rewrite `backend/soap_generator.py`:
   ```python
   import openai
   import os
   import json

   client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

   def generate_soap_note(transcription: str, entities: list) -> dict:
       entity_summary = ", ".join([e["text"] for e in entities])

       try:
           response = client.chat.completions.create(
               model="gpt-4o-mini",
               messages=[
                   {
                       "role": "system",
                       "content": """You are a clinical documentation assistant.
                       Generate a structured SOAP note from the provided transcript and entities.
                       Return ONLY valid JSON with keys: subjective, objective, assessment, plan.
                       Each value must be a well-written clinical paragraph. Do not use bullet lists.
                       Be concise and clinically accurate. Do not repeat the same information across sections."""
                   },
                   {
                       "role": "user",
                       "content": f"Transcript:\n{transcription}\n\nExtracted medical entities: {entity_summary}\n\nGenerate SOAP note as JSON."
                   }
               ],
               temperature=0.3,
               max_tokens=1000
           )
           content = response.choices[0].message.content
           # Strip markdown fences if present
           content = content.replace("```json", "").replace("```", "").strip()
           return json.loads(content)
       except Exception as e:
           print(f"OpenAI SOAP generation failed: {e}")
           # Fall back to rule-based generation
           return generate_soap_note_fallback(transcription, entities)
   ```
4. Test with the diabetes follow-up transcript and verify output matches expected quality.

### Priority 2 — Entity Label Categorisation

**Problem:** `en_core_sci_sm` returns `"ENTITY"` for all entities. Frontend keyword matching compensates but is imperfect.

**Solution:** Upgrade to `en_ner_bc5cdr_md` which returns `CHEMICAL` and `DISEASE` labels.

**Steps:**
1. Install new model:
   ```bash
   pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_bc5cdr_md-0.5.4.tar.gz
   ```
2. Update `entity_extraction.py` to load `en_ner_bc5cdr_md`
3. Update `getEntityCategory()` in `src/lib/utils.ts` to add:
   ```typescript
   if (l === 'CHEMICAL') return 'MEDICATION'
   if (l === 'DISEASE')  return 'CONDITION'
   ```
4. Keep the keyword fallback for entities that still return generic labels.

### Priority 3 — Content Validation Recalibration

**Problem:** Thresholds (10% density, 2 clinical markers) were set on early test data.

**Solution:** After Priority 1 and 2 are done, run the 5 existing test scenarios through the pipeline and check validation scores. Adjust thresholds if cases are being incorrectly rejected or accepted.

---

## 14. Resume / Portfolio Notes

When this project is complete, the student should be able to say:

> "Built MediScribe AI, a full-stack medical transcription system using OpenAI Whisper for speech-to-text, scispacy for medical NLP, and GPT-4o-mini for SOAP note generation. Architected a FastAPI backend processing clinical audio with sub-5-second latency. Implemented intelligent entity extraction with dynamic compound term merging across 700+ medical terms. Rebuilt the frontend from scratch in React 18 + TypeScript with Zustand state management, achieving a Behance-quality clinical interface with persistent settings, dark mode, editable SOAP notes, and full transcription history. Delivered as a containerised application deployed on Railway and Vercel."

**Key Metrics:**
- Medical term coverage: 700+ terms across 7+ specialties
- Transcription latency: 3-5 seconds per minute of audio
- Entity categorisation: 70%+ accuracy (improving with scispacy upgrade)
- Technologies: FastAPI, Whisper, scispacy, GPT-4o-mini, React 18, TypeScript, Zustand, Tailwind CSS, shadcn/ui, PostgreSQL, Docker, Railway, Vercel

---

## 15. Revised 20-Week Timeline

| Phase | Weeks | Status |
|---|---|---|
| Backend foundation | 1-2 | COMPLETE |
| Original frontend (scrapped) | 6-7 | REPLACED |
| UI/UX prototype design | 8 | COMPLETE |
| React frontend rebuild | 9 | COMPLETE |
| Backend improvements (SOAP + entities) | 9.5 | PENDING |
| Frontend testing and bug fixes | 10 | NEXT |
| Authentication | 11 | NOT STARTED |
| Database integration | 12 | NOT STARTED |
| Docker containerisation | 13 | NOT STARTED |
| Testing and QA | 13-14 | NOT STARTED |
| Deployment | 15-16 | NOT STARTED |
| User testing | 17 | NOT STARTED |
| Documentation and demo video | 18-19 | NOT STARTED |
| Final polish and launch | 20 | NOT STARTED |

**Current overall progress: approximately 45% complete**
**On track for May 2026 completion**

---

*Last Updated: February 27, 2026*
*Session: Week 9 — React Frontend Rebuild Complete + Backend Improvement Planning*
*Next Session: Backend improvements (SOAP generator + entity labels), then Week 10 frontend testing*
*Active Branch: recent-updates*
*System Status: Frontend fully rebuilt with React 18 + TypeScript + Zustand. All pages working: Login (UI only), Dashboard (upload + results), History (search, filter, CRUD), Settings (profile with photo upload, all preferences wired and persisted, dark mode working). Backend unchanged — improvement scheduled before testing phase.*