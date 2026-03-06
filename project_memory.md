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
- SQLAlchemy — ORM for database operations (planned Week 12)
- Alembic — Database migrations (planned Week 12)
- python-jose — JWT token generation (planned Week 12)
- passlib + bcrypt — Password hashing (planned Week 12)
- groq Python SDK — Groq SOAP generation via llama-3.3-70b-versatile

**Database:**
- PostgreSQL — Primary database for persistence (planned Week 12)
- Schema: users, transcriptions, medical_entities, soap_notes

**Authentication:**
- JWT (JSON Web Tokens) — Stateless authentication (planned Week 12)
- bcrypt — Secure password hashing

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

**Frontend (FULLY REBUILT - Week 9, DARK MODE COMPLETE - Week 11, ENTITY COLOURS FIXED - post Week 11):**
- React 18 + TypeScript (.tsx files)
- Vite 7 — Build tool
- **Tailwind CSS — CONFIRMED RUNNING v4** (index.css uses `@import "tailwindcss"` — v4 syntax). The memory file previously said v3. This is wrong. The project is on v4. tailwind.config.js exists but v4 IGNORES it. See Section 20 for full details.
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
├── README.md                     # FULLY REWRITTEN in Week 11
├── backend/
│   ├── main.py                  # Main API server
│   ├── transcription.py         # Whisper transcription
│   ├── entity_extraction.py     # REWRITTEN post-Week 11 — two-pass extraction
│   ├── medical_categories.py    # Medical term dictionaries (837 terms)
│   ├── medical_categories_backup.py
│   ├── soap_generator.py        # SOAP note generation (Groq-powered)
│   ├── content_validator.py     # Medical content validation
│   ├── spell_correction.py      # DISABLED — built but not used
│   └── requirements.txt
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tsconfig.app.json
    ├── tailwind.config.js        # EXISTS but ignored by Tailwind v4
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── App.tsx              # Root component, dark mode, routing
        ├── main.tsx             # Entry point with Toaster
        ├── index.css            # Global styles — uses @import "tailwindcss" (v4)
        ├── types/
        │   └── index.ts         # All TypeScript interfaces
        ├── lib/
        │   └── utils.ts         # REWRITTEN post-Week 11 — see Section 4 for new API
        ├── services/
        │   └── api.ts           # REWRITTEN post-Week 11 — normalizes all entity labels
        ├── store/
        │   └── appStore.ts      # Zustand store (navigation, upload, history, settings)
        └── components/
            ├── layout/
            │   ├── Sidebar.tsx  # Collapsible nav — always dark navy
            │   └── TopBar.tsx   # Sticky header — full dark mode
            └── features/
                ├── upload/
                │   ├── StatsBar.tsx
                │   ├── UploadZone.tsx
                │   ├── UploadCard.tsx
                │   └── TranscribeButton.tsx
                └── results/
                    ├── ResultsPanel.tsx
                    ├── TranscriptionCard.tsx
                    ├── EntitiesCard.tsx     # REWRITTEN post-Week 11 — uses getEntityDotColor
                    ├── EntityChip.tsx       # REWRITTEN post-Week 11 — uses inline styles
                    └── SOAPNoteCard.tsx
        └── pages/
            ├── LoginPage.tsx
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
- `setPage(page)`, `toggleSidebar()`, `setFile(file)`, `setUploadState(state)`
- `setProcessingStatus(msg)`, `setResult(result)`, `setError(msg)`, `clearUpload()`
- `addToHistory(result, file)`, `deleteHistoryItem(id)`, `clearHistory()`
- `updateProfile(partial)`, `updatePreferences(partial)`, `updateNotifications(partial)`
- `resetSettings()` — restores preferences and notifications to defaults

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

### Utility Functions (`src/lib/utils.ts`) — REWRITTEN post-Week 11

**Current exported functions:**

- `cn(...inputs)` — Tailwind class merging with clsx + tailwind-merge
- `getEntityCategory(label)` — Maps label string to EntityCategory using includes() checks:
  ```typescript
  if (l.includes('SYMPTOM') || l.includes('SIGN'))                               return 'SYMPTOM'
  if (l.includes('DRUG') || l.includes('MED') || l.includes('CHEMICAL'))        return 'MEDICATION'
  if (l.includes('DISEASE') || l.includes('CONDITION') || l.includes('DISORDER')) return 'CONDITION'
  if (l.includes('PROCEDURE') || l.includes('TREATMENT'))                        return 'PROCEDURE'
  if (l.includes('TEST') || l.includes('LAB') || l.includes('DIAGNOSTIC'))      return 'TEST'
  return 'OTHER'
  ```
- `groupEntities(entities)` — Groups flat entity array into GroupedEntities buckets with deduplication
- `formatConfidence(score)` — Converts 0-1 or 0-100 to percentage string
- `getEntityColors(category, darkMode?)` — Returns `{ bg, border, text }` as **plain hex strings** for use in inline styles. See Section 20 for why inline styles are required.
- `getEntityDotColor(category, darkMode?)` — Returns a single **hex string** for the category header dot in EntitiesCard. Used as `style={{ backgroundColor: getEntityDotColor(cat, dark) }}`.
- `generatePatientId()` — Returns random PT-##### string
- `formatDate(date)` — Returns "Feb 20, 2026 · 9:14 AM"

**REMOVED: `getEntityStyles()`** — This function previously returned Tailwind class strings. It has been removed because Tailwind (both v3 and v4) cannot include dynamically-returned class strings in the CSS bundle. It is replaced by `getEntityColors()` and `getEntityDotColor()`. Do not re-add `getEntityStyles()` or any function that returns Tailwind class strings for colours used at runtime.

### API Service (`src/services/api.ts`) — REWRITTEN post-Week 11

- Base URL: `import.meta.env.VITE_API_URL || 'http://localhost:8000'`
- Timeout: 120 seconds
- `transcribeAudio(file: File)` — POST multipart/form-data to `/api/transcribe`

**`normalizeTranscriptionResult()` — current behaviour:**
- Handles both flat array and nested `{ all_entities: [] }` entity shapes from backend
- Explicitly maps each entity's `label` field through `.toUpperCase()` to normalise casing
- Preserves synthetic labels from the backend dictionary scan (`SYMPTOM`, `TEST`, `PROCEDURE`) — these pass through to `getEntityCategory()` correctly
- Extracts `confidence_score` from `validation.confidence_score` when not at top level

### EntityChip (`src/components/features/results/EntityChip.tsx`) — REWRITTEN post-Week 11

Uses **inline styles** for all three colour properties:
```tsx
<span
  style={{
    backgroundColor: colors.bg,
    borderLeftColor: colors.border,
    color:           colors.text,
  }}
>
```
Structural classes (padding, border-radius, font size, hover translate, `border-l-[3px]`) remain as Tailwind because they are static literal strings and are always scanned correctly.

### EntitiesCard (`src/components/features/results/EntitiesCard.tsx`) — REWRITTEN post-Week 11

Category header dot uses inline style:
```tsx
<div
  className="w-[7px] h-[7px] rounded-full flex-shrink-0"
  style={{ backgroundColor: getEntityDotColor(cat, dark) }}
/>
```
Imports `getEntityDotColor` from utils — does NOT import `getEntityStyles`.

### Routing

Handled by Zustand `currentPage` state, not React Router. App.tsx conditionally renders pages.

---

## 5. Pages — Current State (All pages dark mode complete)

### LoginPage
UI complete, dark mode complete. Auth is mock/simulated only. Any email/password works.
- `AuthField` sub-component accepts `dark: boolean` prop
- Google SSO: toast ("coming in a future update") — never scheduled for a specific week, not behind schedule
- Real JWT auth is planned for Week 12

### DashboardPage
Thin wrapper only. StatsBar + UploadCard + ResultsPanel handle dark mode internally.

### HistoryPage
Full dark mode. Table, confidence badges (dark variants), modals all dark-aware.
Confidence stored as 0-100 (normalised on `addToHistory`).

### SettingsPage
Full dark mode. All 5 tabs. `SettingRow` and `FormField` sub-components accept `dark` prop.
Left nav active state dark: `bg-[#1E3A5F] text-[#93C5FD]`.

### Sidebar
Intentionally always dark navy — no dark mode changes. Same reasoning as VS Code sidebar.

### TopBar
Already had full dark mode before Week 11. No changes needed.

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

**Do NOT use Tailwind `dark:` variants.** The project uses `document.documentElement.classList` toggling, so `dark:` variants would work syntactically, but the codebase consistently uses the `cn()` conditional pattern with `preferences.darkMode`. Stay consistent.

**Do NOT return Tailwind class strings for colours from runtime functions.** See Section 20.

---

## 7. Backend — Current State

### Two-Pass Entity Extraction (REWRITTEN post-Week 11)

`entity_extraction.py` now runs two passes:

**Pass 1 — NER model (en_ner_bc5cdr_md):**
Detects `CHEMICAL` (medications) and `DISEASE` (conditions/symptoms tagged as diseases) with high confidence. Returns entities with these labels.

**Pass 2 — Dictionary scan (`dictionary_scan()` function):**
Runs after the NER pass. Scans the raw transcription text directly against:
- `SYMPTOMS` dictionary → returns entities with label `SYMPTOM`
- `TEST_TERMS` (subset of PROCEDURES) → returns entities with label `TEST`
- `PROCEDURE_TERMS` (PROCEDURES minus TEST_TERMS) → returns entities with label `PROCEDURE`

Deduplication: tracks covered character ranges from Pass 1. If a term's position overlaps an existing NER entity, it is skipped. This prevents double-counting (e.g. "chest pain" tagged as DISEASE by the NER model is not re-added as SYMPTOM by the dictionary scan).

**Why this was necessary:** `en_ner_bc5cdr_md` only returns CHEMICAL and DISEASE. It never tags symptoms-only terms (e.g. "fatigue", "dizziness"), procedures (e.g. "ECG"), or tests. Before this fix, those categories never appeared in the frontend at all.

**Label flow:**
```
Backend Pass 1: CHEMICAL  → frontend getEntityCategory() → MEDICATION
Backend Pass 1: DISEASE   → frontend getEntityCategory() → CONDITION
Backend Pass 2: SYMPTOM   → frontend getEntityCategory() → SYMPTOM
Backend Pass 2: TEST      → frontend getEntityCategory() → TEST
Backend Pass 2: PROCEDURE → frontend getEntityCategory() → PROCEDURE
```

### SOAP Generation (Groq — unchanged)
- Model: `llama-3.3-70b-versatile` via Groq free tier
- Key: `GROQ_API_KEY` in `.env`
- Fallback: rule-based generation if Groq call fails
- SOAP sections from Groq: plain prose strings
- SOAP sections from fallback: structured dicts
- `source` field: `"groq-llama-3.3-70b-versatile"` or `"rule-based-fallback"`
- SOAP quality: Near Production per physician review (4 cycles)

### Critical — main.py import order
```python
from dotenv import load_dotenv
load_dotenv()   # MUST come before all local imports

from fastapi import FastAPI, ...
from soap_generator import generate_soap_note
# etc.
```

---

## 8. API Response Structure

**Success response from `/api/transcribe`:**
```json
{
  "success": true,
  "transcription": "...",
  "validation": { "is_valid": true, "confidence_score": 0.87, ... },
  "entities": {
    "total": 30,
    "all_entities": [
      { "text": "chest pain",  "label": "DISEASE",   "confidence": 0.95, "start": 0, "end": 10 },
      { "text": "fatigue",     "label": "SYMPTOM",   "confidence": 0.0,  "start": 0, "end": 7  },
      { "text": "ECG",         "label": "TEST",      "confidence": 0.0,  "start": 0, "end": 3  },
      { "text": "aspirin",     "label": "CHEMICAL",  "confidence": 0.92, "start": 0, "end": 7  }
    ]
  },
  "soap_note": { "subjective": "...", "objective": "...", "assessment": "...", "plan": "..." }
}
```

Note: dictionary scan entities (SYMPTOM, TEST, PROCEDURE) have `confidence: 0.0` — they are dictionary matches, not NER predictions. This is correct and expected.

**Validation failure response:** `success: false`, no `entities` or `soap_note`. `normalizeTranscriptionResult()` handles this gracefully.

**Confidence score normalisation:** backend 0-1 → `normalizeTranscriptionResult()` extracts → `addToHistory()` multiplies to 0-100 → history stores/displays as 0-100.

---

## 9. Preferences and Their Effects

| Preference | Where it takes effect |
|---|---|
| darkMode | App.tsx useEffect adds/removes `dark` class on `<html>`. All components read `preferences.darkMode` directly. |
| autoScroll | ResultsPanel.tsx — scrollIntoView on results appear |
| compactView | ResultsPanel passes `compact` prop to result cards |
| showConfidence | TranscriptionCard.tsx — hides/shows confidence strip |
| autoCopy | TranscriptionCard.tsx — auto-copies on transcription load |
| transcriptDone | TranscribeButton.tsx — conditionally fires success toast |
| emailNotifs | UI only |
| weeklyReport | UI only |

---

## 10. Known Frontend Limitations

- Login is UI-only — any credentials work, no token stored
- History persists via Zustand/localStorage — will be replaced with PostgreSQL in Week 12
- Profile photo stored as base64 in localStorage — will move to server storage in Week 12
- SOAP note edits are local React state only — not persisted
- Negation detection not implemented ("denies chest pain" still extracts "chest pain")

---

## 11. Development Commands

```bash
# Backend
cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend && npm run dev   # port 5173

# Git
git add . && git commit -m "description" && git push
# All changes on recent-updates branch
```

---

## 12. Progress Snapshot — As of March 6, 2026

### Completed

**Weeks 1-2:** Backend foundation — FastAPI, Whisper, scispacy, entity extraction, content validation

**Week 8:** UI/UX prototype design (v1, v2, v3 HTML prototypes)

**Week 9:** Full React 18 + TypeScript frontend rebuild

**Week 9.5:** Backend improvements — en_ner_bc5cdr_md upgrade, Groq SOAP generation, 4 physician review cycles

**Week 10:** Frontend testing — all 5 scenarios, TranscribeButton validation failure bug fixed

**Week 11:** Full dark mode across all pages and components, README rewritten

**Post-Week 11 (current session):**
- Fixed entity categorisation — all 5 categories now working (SYMPTOM, MEDICATION, CONDITION, PROCEDURE, TEST)
- Fixed entity chip colours — Tailwind v4 scanner issue resolved using inline styles
- Rewrote `entity_extraction.py` — two-pass extraction (NER + dictionary scan)
- Rewrote `utils.ts` — `getEntityStyles()` replaced by `getEntityColors()` + `getEntityDotColor()`
- Rewrote `EntityChip.tsx` — inline styles for bg/border/text
- Rewrote `EntitiesCard.tsx` — inline style for dot colour
- Rewrote `api.ts` — normalises entity labels to uppercase, preserves synthetic labels

### Not Yet Started
- Screenshots for README
- Docker containerisation
- PostgreSQL database integration
- JWT authentication
- Production deployment

---

## 13. Next Steps — Priority Order

**1. Screenshots for README** — take before next dev session:
- Dashboard light mode — completed transcription with all entity categories visible
- Dashboard dark mode — same state, dark toggled
- History page with entries
- Login page

**2. Docker containerisation (Week 12-13)** — start here next session:
- `Dockerfile` for FastAPI backend
- `docker-compose.yml` for both servers
- `.dockerignore`
- Before writing: ask student to paste `requirements.txt` and `package.json`

**3. PostgreSQL + JWT auth (Week 12)**

**4. Deployment to Railway + Vercel (Weeks 15-16)**

---

## 14. Backend Remaining Improvement Backlog

**Complaint-based smart templates:** Detect chief complaint and inject complaint-specific checklist into SOAP prompt. Low priority.

**Medication normalisation verification:** Post-processing layer with RapidFuzz formulary check. Low priority.

**SOAP note edit persistence:** Future `PATCH /api/soap/{id}` endpoint once database is live.

---

## 15. Resume / Portfolio Notes

"Built MediScribe AI, a full-stack medical transcription system using OpenAI Whisper for speech-to-text, scispacy (en_ner_bc5cdr_md) for medical NLP, and Groq's llama-3.3-70b-versatile for SOAP note generation. Architected a FastAPI backend with a two-pass entity extraction pipeline (NER model + dictionary scan) covering all five clinical entity categories. Rebuilt the frontend from scratch in React 18 + TypeScript with Zustand state management, achieving a production-quality clinical interface with full dark mode, persistent settings, editable SOAP notes, and session history. Iterated SOAP generation quality through four physician review cycles, achieving Near Production clinical documentation quality."

**Key Metrics:**
- 837 medical terms across 7+ specialties
- 5 entity categories fully working: SYMPTOM, MEDICATION, CONDITION, PROCEDURE, TEST
- SOAP quality: Near Production per physician review
- Technologies: FastAPI, Whisper, scispacy, Groq API, React 18, TypeScript, Zustand, Tailwind CSS (v4), shadcn/ui

---

## 16. README — Current State (Rewritten Week 11)

Fully rewritten with pipeline diagram, architecture decisions section (4 decisions with trade-off reasoning), correct stack, API reference, testing table, known limitations, updated timeline. Screenshots not yet added — this is the only remaining gap.

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
| Docker + PostgreSQL + JWT auth | 12-13 | NOT STARTED |
| Testing and QA | 14 | NOT STARTED |
| Deployment (Railway + Vercel) | 15-16 | NOT STARTED |
| User testing | 17 | NOT STARTED |
| Documentation and demo video | 18-19 | NOT STARTED |
| Final polish and launch | 20 | NOT STARTED |

**Current overall progress: approximately 65% complete**
**On track for May 2026 completion**

---

## 18. Instructions for Future Claude Sessions

### How to Resume Development

1. Read this entire memory file before responding to any request
2. Ask the student to paste relevant file contents before making changes — never assume what is in a file
3. Before writing code, confirm the current state matches what the memory file describes
4. All commits go to the `recent-updates` branch

### Student Skill Level (Updated March 2026)

- Python: Comfortable, can write and debug independently
- React + TypeScript: Intermediate
- Tailwind CSS v4: Aware of scanner limitations — knows inline styles are required for runtime colours
- Zustand: Understands store pattern, slices, persist middleware
- Git: Basic commands, `recent-updates` branch for all work
- Backend: Understands FastAPI, scispacy pipeline, Groq SOAP generation

### Student Preferences

- NO EMOJIS in code, UI, comments, or responses — use Lucide icons for UI only
- Prefers detailed explanations with code examples
- Likes to understand WHY, not just HOW
- Professional tone throughout
- Clean, maintainable code

### The 100% Free Constraint

Non-negotiable. Groq free tier (14,400 requests/day). Codespaces, Railway free tier, Vercel free tier.

---

## 19. Critical Reminders

1. **Tailwind is v4, not v3.** `index.css` uses `@import "tailwindcss"` (v4 syntax). `tailwind.config.js` is ignored by v4. Do not add `content:` paths or `safelist:` to tailwind.config.js — it has no effect.
2. **Never return Tailwind class strings for runtime colours.** Use `getEntityColors()` and `getEntityDotColor()` which return hex strings, applied via inline styles. This is the permanent solution.
3. **`getEntityStyles()` has been removed from utils.ts.** If any code references it, it will throw. Use `getEntityColors()` instead.
4. Zustand store uses `partialize` to exclude non-serialisable File objects from persistence.
5. Confidence score: backend returns 0-1 in `validation.confidence_score` → `normalizeTranscriptionResult()` extracts it → `addToHistory()` converts to 0-100.
6. `AppPage` type includes `'login'` — always include when updating types.
7. Sidebar toggle is a full-width button row, NOT part of the logo row.
8. All development commits to `recent-updates` branch.
9. `load_dotenv()` in main.py MUST come before all local module imports.
10. Groq model is `llama-3.3-70b-versatile` — `llama-3.1-70b-versatile` was decommissioned.
11. SOAP sections from Groq are plain prose strings; fallback sections are structured dicts — `toPlainText()` in SOAPNoteCard handles both.
12. Dark mode pattern: read `preferences.darkMode`, derive `const dark`, use `cn()` conditionals. Do NOT use Tailwind `dark:` variants.
13. `normalizeTranscriptionResult()` preserves synthetic labels (SYMPTOM, TEST, PROCEDURE) from the backend dictionary scan. Do not strip or remap these — they are intentional.
14. Dictionary scan entities have `confidence: 0.0` — this is correct, they are dictionary matches not NER predictions.
15. The backend returns `entities` as a nested object `{ all_entities: [] }` — `normalizeTranscriptionResult()` extracts the flat array. Do not change the backend response shape without updating this function.

---

## 20. Tailwind v4 and the Entity Colour System — Full Explanation

### Why the project is on Tailwind v4

`frontend/src/index.css` contains `@import "tailwindcss"` — this is the Tailwind v4 import syntax. Tailwind v3 uses `@tailwind base; @tailwind components; @tailwind utilities;`. The presence of the v4 import means the project is running v4 regardless of what `tailwind.config.js` says. In v4, `tailwind.config.js` is completely ignored.

### Why dynamic Tailwind class strings don't work

Tailwind's CSS scanner works at build time by scanning source files for class name strings. It includes a class in the output bundle only if it finds the complete literal string (e.g. `bg-red-50`) somewhere in the scanned files. When a class name is assembled at runtime — returned from a function, read from an object, or constructed with string interpolation — the scanner never sees it and never generates the CSS. The class exists in the DOM but has no styles.

This was the root cause of the chip colour bug. `getEntityStyles()` returned strings like `'bg-red-50'` and `'border-l-red-500'` from a runtime lookup. The scanner never saw those strings as literals, so the CSS was never generated.

### Why arbitrary hex values like `bg-[#FEF2F2]` also don't work from functions

Arbitrary values are also only included when found as complete literal strings in scanned files. `bg-[#FEF2F2]` returned from a function at runtime has the same problem as `bg-red-50`.

### The correct permanent solution: inline styles for runtime colours

`style={{ backgroundColor: '#FEF2F2' }}` bypasses the Tailwind scanner entirely. Inline styles are applied directly by the browser and are never processed by the build system. This works identically in v3 and v4 and is the correct approach for any colour that is determined at runtime.

**Rule for this codebase:** Any colour value that is selected conditionally at runtime (based on entity category, dark mode, or any other runtime variable) MUST be applied as an inline style using a hex value. Static colours used in the same way every time (e.g. `bg-[#1E293B]` hardcoded in a className) can remain as Tailwind classes because they are literal strings the scanner can find.

---

*Last Updated: March 6, 2026*
*Session: Post-Week 11 — Entity Categorisation Fix + Entity Chip Colour Fix*
*Changes this session: entity_extraction.py rewritten with two-pass extraction (NER + dictionary scan), utils.ts rewritten (getEntityStyles removed, getEntityColors + getEntityDotColor added), EntityChip.tsx rewritten (inline styles), EntitiesCard.tsx rewritten (inline style for dot), api.ts rewritten (preserves synthetic labels). Discovered project is on Tailwind v4, not v3.*
*Next Session: Screenshots for README, then Week 12 — Docker containerisation*
*Active Branch: recent-updates*
*System Status: All 5 entity categories working and colour-coded correctly. Full dark mode across all pages. Backend entity extraction covers SYMPTOM, MEDICATION, CONDITION, PROCEDURE, TEST. Ready for infrastructure phase.*