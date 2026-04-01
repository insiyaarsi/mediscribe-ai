import os
from pathlib import Path

import torch

try:
    from faster_whisper import WhisperModel  # type: ignore
except ImportError:  # pragma: no cover - optional fast path
    WhisperModel = None

import whisper

WHISPER_BACKEND = os.getenv("WHISPER_BACKEND", "faster-whisper")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base.en")
WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
WHISPER_BEAM_SIZE = int(os.getenv("WHISPER_BEAM_SIZE", "3"))

INITIAL_PROMPT = (
    "English clinical consultation between a medical student and a patient. "
    "Common terms include chest pain, breathlessness, palpitations, sore throat, "
    "heart attack, pericarditis, ECG, troponin, date of birth, diabetes, "
    "blood test, glucose, insulin, HbA1c, metformin, thrush, urinary tract "
    "infection, lifestyle, retinal screening, foot check, and GP surgery."
)

if os.cpu_count():
    torch.set_num_threads(max(1, os.cpu_count()))

print("Loading transcription model...")

_backend_name = "openai-whisper"
_fw_model = None
_ow_model = None

if WHISPER_BACKEND == "faster-whisper" and WhisperModel is not None:
    _fw_model = WhisperModel(
        WHISPER_MODEL,
        device="cpu",
        compute_type=WHISPER_COMPUTE_TYPE,
        cpu_threads=max(1, os.cpu_count() or 1),
    )
    _backend_name = "faster-whisper"
else:
    _ow_model = whisper.load_model(WHISPER_MODEL)

print(f"Transcription model loaded successfully! backend={_backend_name}, model={WHISPER_MODEL}")


def _transcribe_with_faster_whisper(audio_file_path: str) -> tuple[str, str]:
    assert _fw_model is not None

    segments, info = _fw_model.transcribe(
        audio_file_path,
        task="transcribe",
        language="en",
        beam_size=WHISPER_BEAM_SIZE,
        best_of=1,
        condition_on_previous_text=True,
        vad_filter=False,
        initial_prompt=INITIAL_PROMPT,
        word_timestamps=False,
    )

    text = " ".join(segment.text.strip() for segment in segments if segment.text).strip()
    return text, (info.language or "en")


def _transcribe_with_openai_whisper(audio_file_path: str) -> tuple[str, str]:
    assert _ow_model is not None

    result = _ow_model.transcribe(
        audio_file_path,
        task="transcribe",
        language="en",
        temperature=0.0,
        best_of=1,
        condition_on_previous_text=True,
        fp16=False,
        initial_prompt=INITIAL_PROMPT,
    )

    return result["text"], result.get("language", "en")


def transcribe_audio(audio_file_path: str) -> dict:
    """
    Transcribe audio file using a local Whisper backend.

    Prefer faster-whisper on CPU for better throughput with similar quality.
    Fall back to openai-whisper if faster-whisper is not installed.
    """
    try:
        print(f"Transcribing: {audio_file_path}")

        if _backend_name == "faster-whisper":
            transcription_text, detected_language = _transcribe_with_faster_whisper(audio_file_path)
        else:
            transcription_text, detected_language = _transcribe_with_openai_whisper(audio_file_path)

        print("=" * 50)
        print(f"SUCCESS! Transcribed: {transcription_text[:100]}...")
        print("=" * 50)

        return {
            "success": True,
            "text": transcription_text,
            "language": detected_language,
            "duration": None,
            "error": None,
            "backend": _backend_name,
            "model": WHISPER_MODEL,
        }

    except Exception as e:
        import traceback

        error_detail = traceback.format_exc()
        print("=" * 50)
        print("TRANSCRIPTION ERROR:")
        print(error_detail)
        print("=" * 50)

        return {
            "success": False,
            "text": None,
            "language": None,
            "duration": None,
            "error": str(e),
            "backend": _backend_name,
            "model": WHISPER_MODEL,
        }


def transcribe_audio_realtime(audio_file_path: str) -> str:
    """
    Simplified version that returns just the text.
    """
    result = transcribe_audio(audio_file_path)

    if result["success"]:
        return result["text"]
    raise Exception(f"Transcription failed: {result['error']}")
