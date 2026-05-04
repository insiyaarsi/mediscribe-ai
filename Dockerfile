# =============================================================================
# MediScribe AI — Backend Dockerfile
# Base image: Python 3.12 slim (Debian Bookworm)
# =============================================================================

FROM python:3.12-slim

# -----------------------------------------------------------------------------
# System dependencies
#
# ffmpeg       — required by Whisper backends for audio decoding
# build-essential, gcc — required to compile some scispaCy / spaCy C extensions
# git          — required by some pip packages that fetch from VCS
# curl         — useful for health-check debugging; remove if you want minimal image
# -----------------------------------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    build-essential \
    gcc \
    git \
    curl \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# -----------------------------------------------------------------------------
# Working directory inside the container
# -----------------------------------------------------------------------------
WORKDIR /app

# -----------------------------------------------------------------------------
# Install Python dependencies
#
# We copy requirements.txt first and install before copying application code.
# This exploits Docker's layer cache: if requirements.txt is unchanged, this
# expensive layer (scispaCy model download, transcription deps) is not re-run on
# every code change — only when dependencies actually change.
# -----------------------------------------------------------------------------
COPY backend/requirements.txt .

RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# -----------------------------------------------------------------------------
# Pre-download the faster-whisper model at build time
#
# Why: faster-whisper downloads the model on the FIRST transcription call at
# runtime. In a container this means:
#   - The first request after deployment takes 30-60 seconds (140MB download)
#   - If the container has no outbound internet access at runtime, it fails
#   - Railway containers can be cold-started — every cold start would re-download
#
# By downloading during the build, the model is baked into the image layer.
# Subsequent container starts are instant. The model lives in the Hugging Face
# cache used by faster-whisper / ctranslate2.
# -----------------------------------------------------------------------------
ARG WHISPER_MODEL=base.en
RUN python -c "from faster_whisper import WhisperModel; WhisperModel('${WHISPER_MODEL}', device='cpu', compute_type='int8')"

# -----------------------------------------------------------------------------
# Copy application source code
#
# This layer comes AFTER dependency install so code changes don't invalidate
# the expensive dependency cache layer above.
# -----------------------------------------------------------------------------
COPY backend/ .

# -----------------------------------------------------------------------------
# Runtime configuration
#
# PORT 8000 — FastAPI/Uvicorn default. Must match docker-compose and Railway config.
# -----------------------------------------------------------------------------
EXPOSE 8000

# -----------------------------------------------------------------------------
# Health check
#
# Docker (and Railway) use this to determine if the container is ready.
# /api/health should be a simple 200 endpoint in main.py — see note below.
# Interval: check every 30s. Timeout: fail if no response in 10s.
# Retries: mark unhealthy after 3 consecutive failures.
# -----------------------------------------------------------------------------
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# -----------------------------------------------------------------------------
# Start command
#
# --host 0.0.0.0   — bind to all interfaces (required inside a container;
#                    without this, Uvicorn binds to 127.0.0.1 which is
#                    unreachable from outside the container network)
# --port 8000      — explicit port
# --workers 1      — single worker; the transcription model is memory-heavy.
#                    Multiple workers would each load a separate model instance.
# No --reload      — reload is for development only; it adds overhead and
#                    requires source files to be writable
# -----------------------------------------------------------------------------
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
