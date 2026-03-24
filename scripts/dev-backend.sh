#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
VENV_DIR="$ROOT_DIR/.venv"

if [[ -f "$VENV_DIR/bin/activate" ]]; then
  # Reuse the project virtualenv automatically when it exists.
  # This keeps local backend runs independent from the codespace global Python.
  # shellcheck disable=SC1091
  source "$VENV_DIR/bin/activate"
fi

# Override the Docker-only hostname from .env when running locally.
export DATABASE_URL="${DATABASE_URL:-postgresql://mediscribe:mediscribe_dev_password@localhost:5432/mediscribe}"

cd "$BACKEND_DIR"

if ! python -c "import sqlalchemy" >/dev/null 2>&1; then
  echo "Local backend dependencies are not installed."
  echo
  echo "Set up a virtualenv and install backend requirements once:"
  echo "  python3 -m venv .venv"
  echo "  source .venv/bin/activate"
  echo "  pip install -r backend/requirements.txt"
  echo
  echo "Then run ./scripts/dev-backend.sh again."
  exit 1
fi

echo "Starting backend locally with reload on http://localhost:8000"
echo "Using DATABASE_URL=$DATABASE_URL"
exec uvicorn main:app --reload --host 0.0.0.0 --port 8000
