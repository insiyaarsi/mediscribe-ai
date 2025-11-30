from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create the FastAPI application
app = FastAPI(
    title="MediScribe AI API",
    description="Real-time medical transcription and documentation system",
    version="1.0.0"
)

# Configure CORS (allows frontend to talk to backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, this would be specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint - just to test the server is working
@app.get("/")
def read_root():
    return {
        "message": "Welcome to MediScribe AI",
        "status": "Server is running",
        "version": "1.0.0"
    }

# Health check endpoint
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "MediScribe AI Backend"
    }

# Test endpoint for transcription (we'll build this properly later)
@app.get("/api/test")
def test_endpoint():
    return {
        "message": "API is working correctly",
        "ready_for": "medical transcription"
    }