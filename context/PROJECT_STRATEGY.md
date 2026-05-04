# Project Strategy

## 1. Executive Summary

MediScribe AI is a portfolio-first clinical documentation product: an authenticated web app that lets a clinician upload encounter audio, transcribe it, validate that the conversation is actually medical, extract structured clinical entities, and generate a SOAP note. That description is grounded in the current codebase: `backend/main.py` exposes auth, history, and transcription endpoints; the transcription route calls ASR, spell correction, validation, entity extraction, clinical extraction, SOAP generation, and PostgreSQL persistence; the React frontend exposes login, dashboard, history, and settings pages.

The right audience lens for this project is not large health systems. The current build has no EHR integration, no scheduling context, no coding workflow, and no enterprise deployment motion in the repo. The better positioning is solo clinicians and small practices that want a lightweight AI documentation assistant without enterprise complexity. For a student portfolio, that is a strength, not a compromise: it shows product judgment, scoped execution, and real full-stack AI engineering instead of hospital-enterprise cosplay.

The core bet is that a small-practice tool can win on trustable simplicity: fast setup, visible transcript-to-note flow, and enough structure to reduce charting burden without requiring a procurement cycle. The single biggest opportunity ahead is to move from “audio in, note out” to “small-practice clinical workflow assistant” by adding encounter-aware templates and structured review controls that help clinicians verify and finalize notes quickly.

## 2. What We're Building

MediScribe AI is a full-stack medical transcription and documentation assistant. A user registers or logs in, uploads audio, and receives a transcription, validation result, extracted entities, clinical representation, and SOAP note. Each result is stored and retrievable through authenticated history endpoints. The backend architecture and response shape are visible in `backend/main.py`, `backend/models.py`, and `backend/schemas.py`; the frontend consumption path is visible in `frontend/src/services/api.ts` and `frontend/src/App.tsx`.

The target users, using the agreed lens, are independent clinicians, trainees, and small practices that do not have enterprise AI-scribe procurement power but still feel the same documentation burden. That audience is partly an inference from the product shape rather than an explicit statement in code: the app is self-contained, web-based, and currently lacks the enterprise traits that define products aimed at hospital systems.

Their core jobs-to-be-done are straightforward:

- Turn a patient conversation into a usable SOAP note quickly.
- Reduce after-hours charting without giving up clinical control.
- Keep a searchable personal history of prior generated notes.
- Avoid wasting time on non-clinical or too-short audio inputs.

The current value proposition is: “Give us a clinical conversation and we will return a structured draft note with enough supporting detail to review, trust, and reuse.” That value prop is grounded in the implemented pipeline: duration guard, content validation, entity extraction, structured clinical extraction, and note generation are all present in the live route.

## 3. Project Structure

### Tech Stack And Key Dependencies

Backend:

- FastAPI for the API surface
- SQLAlchemy + PostgreSQL for persistence
- `python-jose` + `passlib[bcrypt]` for auth
- `faster-whisper` for ASR, with optional `openai-whisper` fallback code path
- `scispacy` + biomedical model + custom dictionaries for medical extraction
- Groq SDK for primary SOAP generation
- Alembic is initialized but not yet the migration source of truth

Frontend:

- React 19
- TypeScript
- Vite 7
- Zustand for client state
- Axios for API access
- Tailwind CSS v4 for styling

Operational/dev:

- Dockerfiles for backend and frontend
- `docker-compose.yml` for backend, frontend, and Postgres
- Local dev scripts under `scripts/`

### Architecture Overview

This is a single-repo, single-backend, single-frontend application. It is not a microservices system. The architectural shape is:

```text
Clinician
   |
   v
React frontend
   |
   |  Authenticated HTTP
   v
FastAPI backend
   |
   +--> ASR (`faster-whisper`)
   +--> Transcript normalization
   +--> Medical content validation
   +--> Entity extraction (`scispacy` + dictionaries)
   +--> Clinical representation extraction
   +--> SOAP generation (Groq, with fallback)
   |
   v
PostgreSQL
```

In request flow terms, the most important route is `/api/transcribe` in `backend/main.py`. It temporarily stores the uploaded file, checks duration if the `X-Audio-Duration-Seconds` header is present, transcribes audio, normalizes the transcript with `correct_medical_spelling`, validates medical relevance with `validate_medical_content`, extracts entities, builds a clinical representation, generates the SOAP note, saves the result, and returns both structured and formatted outputs.

### Directory Map

- `backend/`: FastAPI app, data models, auth, transcription, NLP, SOAP generation, and DB wiring
- `frontend/`: React app, pages, state store, API client, and UI components
- `docs/`: local dev notes, screenshots, test results, and strategy documentation
- `scripts/`: helper scripts for local DB, backend, and frontend startup
- `backend/alembic/`: initialized migration scaffolding, not yet fully adopted in workflow

### Data Model Summary

The relational model is small and clear:

- `User`
- `Transcription`
- `MedicalEntity`
- `SoapNote`

Relationships:

- One `User` has many `Transcription` records.
- One `Transcription` has many `MedicalEntity` rows.
- One `Transcription` has one `SoapNote`.

That shape is defined in `backend/models.py`. It is a good fit for this product because the project stores durable results, not just transient generated text.

## 4. Current Feature Surface

### Authentication And Account

Implemented today:

- Registration
- Login
- Session restore via stored JWT plus `/api/auth/me`
- Account deletion

Evidence: `backend/main.py`, `backend/auth.py`, `frontend/src/services/api.ts`, `frontend/src/App.tsx`.

### Core Documentation Workflow

Implemented today:

- Supported audio upload
- Minimum-duration guardrail for short clips
- Local transcription
- Medical spelling/phrase normalization
- Medical-content validation
- Medical entity extraction and categorization
- Structured clinical extraction
- SOAP note generation
- Plain-text SOAP formatting

Evidence: `backend/main.py`, `backend/transcription.py`, `backend/content_validator.py`, `backend/entity_extraction.py`, `backend/clinical_extraction.py`, `backend/soap_generator.py`.

### History And Persistence

Implemented today:

- Persisted transcriptions tied to a user
- History list
- History detail
- Delete one transcription
- Delete all history

Evidence: `backend/main.py`, `backend/models.py`, `backend/schemas.py`, `frontend/src/services/api.ts`.

### Frontend Product Surface

Implemented today:

- Login page
- Dashboard page
- History page
- Settings page
- Upload card, stats bar, results panel, and result cards

Evidence: `frontend/src/App.tsx` and the page/component files under `frontend/src/`.

### Half-Built, Deprecated, Or Debt-Heavy Areas

- The root `README.md` is materially out of date relative to the live codebase.
- Alembic is installed and initialized, but the backend still depends on `models.Base.metadata.create_all(bind=engine)` at startup. That is practical for local bring-up but technical debt for any deployment story.
- There is no real EHR integration, scheduling context, coding handoff, compliance audit workflow, or team admin surface yet.
- The original repo docs describe an earlier “Week 6” shape that no longer matches the implementation.
- The frontend package structure is solid, but the app is still one product shell rather than a deeply role-based workflow system.

## 5. Competitive Landscape

The closest realistic alternatives, given the agreed small-practice lens, are products a clinician could actually compare against for “help me document visits faster.” The competitor assessments below combine official positioning with explicit inference where needed.

| Competitor | Strength | Weakness | What We Can Learn |
| --- | --- | --- | --- |
| Freed | Self-serve, transparent pricing, clinician-friendly simplicity, specialty templates, some EHR push features | Weakest point appears to be lighter integration depth; even its own docs and G2 feedback note some EHRs still require copy/paste | Simplicity and transparent onboarding matter a lot for small practices |
| Nabla Copilot | Strong multi-EHR positioning, coding suggestions, multilingual support, enterprise-ready embed story | Sales-led and integration-first posture makes it less self-serve; likely heavier than many small practices want. This is partly an inference from the official enterprise-style messaging | Structured outputs and coding/documentation nudges are valuable, but packaging matters |
| Suki | Broad ambient assistant story across notes, orders, coding, and clinical reasoning with deep EHR integration | Positioned for large organizations and complex ecosystems, which raises adoption friction for very small buyers. This is an inference from its official enterprise language and sales-led motion | “Beyond transcription” is the right direction, but only if the workflow expansion stays believable |
| Abridge | Market-leading enterprise credibility, deep EHR integration, auditable linked evidence, multilingual support | Not accessible to most small independent buyers; official site is enterprise-first and sales-led | Evidence-backed note generation and traceability are powerful trust levers |
| Dragon Copilot / DAX lineage | Deep workflow integration and massive enterprise credibility through Microsoft/Nuance | High complexity, enterprise posture, and non-transparent pricing make it a poor fit for small clinics | Workflow embedding and voice-driven editing are table stakes at the high end |

### Pricing / Positioning Posture

- Freed is the clearest small-practice benchmark. Its official pricing page shows self-serve plans starting at monthly individual pricing and group plans, with explicit clinician-focused messaging: https://www.getfreed.ai/pricing
- Nabla, Suki, Abridge, and Microsoft Dragon Copilot all present as sales-led products with official “contact us” or enterprise-style positioning rather than low-friction self-serve checkout:
- https://www.nabla.com/ehr
- https://www.suki.ai/
- https://www.abridge.com/
- https://www.microsoft.com/en-us/health-solutions/clinical-workflow/dragon-copilot/

### Table-Stakes Gap Analysis

To be taken seriously in this category, even as a small-practice tool, the market floor appears to include:

1. Reliable note generation from ambient conversation
2. Template/personalization support by specialty or clinician style
3. Practical workflow handoff into the place the clinician actually charts

MediScribe AI today has number 1 in draft form, partial foundations for number 2, and is missing number 3.

More specifically:

- Present: authenticated upload-to-note workflow
- Present: transcript and note visibility, which helps trust
- Missing: clinician-customizable note templates / style memory
- Missing: EHR export or embedded chart handoff beyond generic download/copy behavior
- Missing: coding, referral, patient-instruction, or post-visit workflow outputs that many competitors now use to expand value

## 6. Feature Roadmap

### Tier A — Quick Wins

#### 1. Clinician-Specific Note Templates And Style Profiles

Pain solved: A family physician and a psychiatry resident do not want the same SOAP shape. Today a user can generate a note, but there is no clear per-user template memory in the product. That makes every note feel generic even if the base generation is competent.

Moat: For a small-practice tool, the moat is not “we have templates.” It is “we quickly learn how one clinician writes and consistently produce notes that feel usable without enterprise setup.”

Effort: M

Main risk: If template controls are added as a thin prompt wrapper without careful UX, they will create more configuration burden than value.

#### 2. Source-Linked Review Mode

Pain solved: A clinician reviewing a generated assessment wants to know, “Where in the conversation did this come from?” Today the app returns a transcript and a note, but there is no review UI that ties note content back to transcript evidence.

Moat: Trust and editability are harder to copy well than basic note generation. Small practices still need auditability, even if they are not buying full enterprise governance.

Effort: M

Main risk: Mapping generated prose back to source text can get fuzzy, especially after normalization and summarization.

#### 3. Copy / Export Workflow Optimized For Actual Charting

Pain solved: A clinician using a browser EHR or local EMR wants a one-click way to move the note into their chart, not a vague “download text file.” The current product has a download endpoint, but this is still weak workflow glue.

Moat: Tight last-mile workflow polish for smaller clinics is under-served because enterprise vendors focus on full integrations.

Effort: S

Main risk: Browser-based export behavior can be brittle across systems unless kept intentionally lightweight.

#### 4. Encounter Type Selection Before Upload

Pain solved: Follow-up review, acute visit, counselling visit, and medication review should not all produce notes the same way. The backend already infers encounter type in `soap_generator.py`; exposing user-selected or confirmable context would improve note quality with minimal complexity.

Moat: Better note structure from low-friction context is a useful product edge for small buyers.

Effort: S

Main risk: Too many choices before upload may make the product feel slower and more complicated.

### Tier B — Differentiators

#### 1. Small-Practice Workflow Pack: Note + Patient Instructions + Referral Letter

Pain solved: After the visit, clinicians often need more than the note. They also need plain-language patient instructions or a referral summary. Competitors like Freed and Suki increasingly expand into post-visit artifacts, and small practices feel that workload sharply.

Moat: The moat is not the extra artifact itself. It is the opinionated “finish the visit” workflow for clinicians without enterprise tooling.

Effort: M

Main risk: If quality is inconsistent, extra outputs will feel like AI clutter rather than real workflow relief.

#### 2. Specialty-Aware Quality Checks

Pain solved: A diabetes follow-up note should not miss medication adherence or retinal screening context; a chest-pain visit should not omit key symptom structure. The repo already has clinical-representation logic and quality reporting hooks in the API response, which suggests a strong base for this.

Moat: Domain-specific review rules are harder to commoditize than “generate a note.”

Effort: M

Main risk: Over-opinionated rules can annoy clinicians if they feel like false alarms.

#### 3. Longitudinal Pull-Forward For Returning Patients

Pain solved: A solo clinician seeing the same patient again should not start from zero. The current data model stores transcriptions and notes, but the product does not yet reuse that history to prepare the next note or pre-chart context.

Moat: Small-practice continuity is a real wedge. Enterprise vendors often emphasize system-wide integration; a lighter-weight continuity layer built from prior generated notes could be compelling.

Effort: L

Main risk: Wrong or stale pulled-forward context could reduce trust quickly.

#### 4. Coding Suggestions With Explicit Confidence / Review Guardrails

Pain solved: Small practices care about reimbursement and complete documentation, but they often cannot justify a large enterprise revenue-cycle platform. Official Nabla and Suki positioning both emphasize coding, which signals this is becoming part of the market floor above pure transcription.

Moat: A transparent, review-first coding assist layer for small practices could be stronger than opaque auto-coding.

Effort: L

Main risk: Accuracy and liability expectations rise sharply as soon as coding is introduced.

### Tier C — Moonshots

#### 1. Personal Clinical Documentation Engine

Pain solved: Clinicians do not just want note generation; they want a system that learns their phrasing, preferred structure, common counseling language, and follow-up patterns over time. This goes beyond templates into durable personal workflow memory.

Moat: If done well, this becomes sticky in a way commodity transcription does not. A clinician who feels “this writes like me” is less likely to switch.

Effort: XL

Main risk: Personalization can drift into incorrect assumptions or reproduce weak documentation habits unless bounded carefully.

#### 2. Small-Clinic Ambient Workspace

Pain solved: The long-term problem is not just documentation burden; it is fragmented administrative follow-through after each visit. A moonshot version of MediScribe AI would turn one conversation into notes, instructions, referrals, coding suggestions, and follow-up tasks for a whole small clinic workflow.

Moat: That is a stronger category than “yet another AI scribe,” especially for underserved smaller practices.

Effort: XL

Main risk: This can easily outrun the project’s credibility if attempted too early, especially for a student portfolio.

## 7. Competitive Edge Strategy

MediScribe AI should try to win on three themes.

### 1. Trustable Simplicity

The product should feel easier to adopt than enterprise ambient AI. That means fast signup, clear transcript visibility, explicit review flows, and minimal setup burden. The roadmap items that support this are source-linked review mode, encounter-type guidance, and chart-ready export.

### 2. Small-Practice Workflow Depth

The product should not attempt to out-enterprise Abridge, Suki, or Microsoft. It should instead go deeper on the practical needs of a clinician who just wants to finish documentation and move on. The roadmap items that support this are clinician-specific templates, post-visit workflow pack, and longitudinal pull-forward for returning patients.

### 3. Structured Clinical Quality, Not Generic Summarization

The repo already contains more domain structure than a generic meeting summarizer: content validation, medical entity extraction, clinical representation building, and quality report hooks. That should become part of the identity. The roadmap items that support this are specialty-aware quality checks and review-first coding suggestions.

### What We Should Deliberately Not Do

- Do not position the product as an enterprise hospital operating system.
- Do not chase broad “AI assistant” sprawl with generic chat features that are not tied to charting pain.
- Do not prioritize deep EHR integrations before the product earns the right through stronger note-quality and review workflows.
- Do not present compliance theater as a substitute for real product depth.

## 8. Recommended Next Move

The one feature to ship next is clinician-specific note templates and style profiles.

It has the best impact-per-effort ratio because it improves every successful transcription without requiring new infrastructure, new external integrations, or a different architecture. The codebase already has the right foundation: authenticated users, stored transcription history, structured SOAP generation, and user model fields that can support future preferences. Market-wise, it also matches the strongest small-practice benchmark: official Freed positioning heavily emphasizes specialty-specific templates and learning clinician format, which is a strong signal that personalization is a real buying criterion, not a nice-to-have.

## 9. Open Questions

- Is the intended primary buyer in your portfolio story an individual clinician, a trainee, or a small multi-provider clinic? The roadmap shifts slightly depending on which one you want to emphasize.
- Do you want this strategy to optimize for “most believable startup story” or “most impressive engineering story” when the two conflict?
- Are you comfortable positioning the eventual product as Canada-first or geography-agnostic? The repo itself does not force a geography, but your job-market narrative might benefit from a more specific framing.
- Do you want privacy/compliance to stay at “responsible prototype” level, or do you want the strategy to lean harder into a future HIPAA/PIPEDA-ready story?
