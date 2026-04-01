#!/usr/bin/env bash
set -euo pipefail

# Start only the PostgreSQL container for fast local app development.
docker compose up -d db

echo
echo "Database is starting in Docker on localhost:5432"
echo "Use scripts/dev-backend.sh and scripts/dev-frontend.sh for the app."
