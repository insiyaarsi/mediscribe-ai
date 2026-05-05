# backend/lib/utils.py
# Small utility functions used by main.py.
# generate_patient_id mirrors the frontend generatePatientId() in src/lib/utils.ts
# so the format is consistent between client-generated and server-generated IDs.

import random
import math


def generate_patient_id() -> str:
    """Returns a random PT-##### string, e.g. PT-48291"""
    return f"PT-{random.randint(10000, 99999)}"


def estimate_duration(file_size_bytes: int) -> str:
    """
    Estimates audio duration from file size.
    This is the same rough heuristic the frontend used before database persistence:
    roughly 1 second per 10KB of audio. Returns a MM:SS string.
    """
    seconds = max(1, file_size_bytes // 10000)
    minutes = seconds // 60
    secs    = seconds % 60
    return f"{minutes}:{str(secs).zfill(2)}"