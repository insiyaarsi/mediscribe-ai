## Local Dev Mode

This keeps Docker for PostgreSQL only and runs the backend/frontend locally with reload.

### Why use this mode

- Python or TypeScript edits do not require rebuilding Docker images
- Backend reloads automatically on save
- Frontend updates immediately through Vite
- Production Docker files remain unchanged for final verification

### Start the database

```bash
./scripts/dev-db.sh
```

This starts only the `db` service from `docker-compose.yml`.

### Start the backend locally

First-time setup:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

After that, start the backend with:

```bash
./scripts/dev-backend.sh
```

What this does:

- runs from `backend/`
- automatically activates `.venv` if it exists
- keeps using the project `.env` for API keys and JWT secret
- overrides `DATABASE_URL` to `localhost:5432` so the local backend can talk to the Docker database
- starts FastAPI with `uvicorn --reload`

Backend URL:

```text
http://localhost:8000
```

### Start the frontend locally

```bash
./scripts/dev-frontend.sh
```

Frontend URL:

```text
http://localhost:5173
```

The frontend already defaults to `http://localhost:8000` in local development when `VITE_API_URL` is not set.

### Typical workflow

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

Then open:

```text
http://localhost:5173
```

### If the backend cannot connect to Postgres

Check that the database container is running:

```bash
docker compose ps
```

If needed, restart just the DB:

```bash
docker compose up -d db
```

### When to switch back to Docker

Once local testing is stable, return to the full container path for final verification:

```bash
docker compose up --build
```
