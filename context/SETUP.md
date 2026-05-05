# Setup

This setup guide is based on the current repo structure and existing dev scripts.

## Prerequisites

- Python 3.12
- Node.js compatible with the frontend toolchain
- npm
- Docker and Docker Compose

## Environment Variables

At minimum, local development needs environment variables that provide:

- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `GROQ_API_KEY`

Optional variables mentioned in the project context include:

- `CORS_ORIGINS`
- `WHISPER_BACKEND`
- `WHISPER_MODEL`
- `WHISPER_COMPUTE_TYPE`
- `WHISPER_BEAM_SIZE`

## Recommended Local Workflow

The repo already includes a preferred hybrid local-dev path.

### 1. Start the database

```bash
./scripts/dev-db.sh
```

### 2. Create a virtual environment if needed

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### 3. Start the backend

```bash
./scripts/dev-backend.sh
```

Backend URL:

```text
http://localhost:8000
```

### 4. Start the frontend

```bash
./scripts/dev-frontend.sh
```

Frontend URL:

```text
http://localhost:5173
```

## Full Docker Path

For fuller containerized verification:

```bash
docker compose up --build
```

Useful related commands:

```bash
docker compose ps
docker compose logs -f backend
docker compose down
docker compose down -v
```

## Notes

- The backend script will auto-activate `.venv` if it exists.
- The backend script also defaults `DATABASE_URL` to local Postgres on `localhost:5432` if one is not already provided.
- The backend script applies pending Alembic migrations before starting Uvicorn.
- The frontend API client defaults to `http://localhost:8000` when `VITE_API_URL` is not set.

## Database Migrations

Alembic is now the migration source of truth. The first baseline migration creates:

- `users`
- `transcriptions`
- `medical_entities`
- `soap_notes`

Manual local migration command:

```bash
cd backend
DATABASE_URL=postgresql://mediscribe:mediscribe_dev_password@localhost:5432/mediscribe alembic -c alembic.ini upgrade head
```

## Recommended Verification Checklist

- Backend health endpoint responds
- Frontend loads
- User can register
- User can log in
- Authenticated upload works
- History list populates
- Single-item and bulk deletion work

## Existing Related Docs

- `docs/local-dev.md`
- `project_memory.md`
