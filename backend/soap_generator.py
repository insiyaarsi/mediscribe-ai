"""
SOAP note generation from categorized medical entities.
Primary path: Groq llama-3.1-70b-versatile for clinical prose.
Fallback path: Rule-based generation if API call fails.
"""
from dotenv import load_dotenv
load_dotenv()

import os
import json
from datetime import datetime
from groq import Groq



# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def generate_soap_note(transcription: str, categorized_entities: dict) -> dict:
    """
    Generate a SOAP note from transcribed text and categorized medical entities.

    Attempts Groq generation first. If the API call fails for any
    reason (network error, invalid key, malformed JSON response, etc.) the
    function falls back to the rule-based generator so the rest of the
    pipeline always receives a valid SOAP dict.

    Args:
        transcription: Full transcription text.
        categorized_entities: Dict of entity lists keyed by category name
                              (symptoms, conditions, medications, procedures).

    Returns:
        Dict with keys: generated_at, subjective, objective, assessment, plan.
        Each section value is either a clinical prose string (Groq path) or
        a structured dict (fallback path) — the frontend handles both shapes.
    """
    try:
        soap = _generate_with_groq(transcription, categorized_entities)
        soap["generated_at"] = datetime.now().isoformat()
        soap["source"] = "groq-llama-3.1-70b-versatile"
        print("SOAP note generated via Groq llama-3.3-70b-versatile")
        return soap
    except Exception as exc:
        print(f"Groq SOAP generation failed: {exc}")
        print("Falling back to rule-based SOAP generation")
        return _generate_fallback(transcription, categorized_entities)


# ---------------------------------------------------------------------------
# Groq-llama-3.1-70b-versatile-mini path
# ---------------------------------------------------------------------------

def _build_entity_summary(categorized_entities: dict) -> str:
    """
    Convert the categorized entity dict into a compact plain-text summary
    suitable for inclusion in the GPT prompt.
    """
    lines = []
    label_map = {
        "symptoms": "Symptoms",
        "conditions": "Conditions / Diagnoses",
        "medications": "Medications",
        "procedures": "Procedures",
        "anatomical": "Anatomical Sites",
        "modifiers": "Clinical Modifiers",
    }
    for key, label in label_map.items():
        entities = categorized_entities.get(key, [])
        if entities:
            terms = ", ".join(e["text"] for e in entities)
            lines.append(f"{label}: {terms}")
    return "\n".join(lines) if lines else "No specific entities extracted."


_SYSTEM_PROMPT = """You are a clinical documentation assistant specialised in
generating accurate, concise SOAP notes for physician review.

Rules:
- Return ONLY valid JSON. No markdown fences, no preamble, no explanation.
- JSON must have exactly four keys: subjective, objective, assessment, plan.
- Each value must be a single well-formed clinical paragraph (3-5 sentences).
- Write in third-person clinical style (e.g. "The patient presents with...").
- Do not use bullet points or numbered lists inside any section.
- Do not repeat the same clinical information across sections.
- subjective: patient-reported symptoms and history of present illness.
- objective: observable or measurable findings, vital signs, examination findings.
- assessment: clinical impression and diagnoses based on the above.
- plan: treatment, medications, investigations ordered, and follow-up instructions."""


def _generate_with_groq(transcription: str, categorized_entities: dict) -> dict:
    """
    Call Groq API and parse the JSON response into a SOAP dict.

    Raises an exception if the API call fails or the response cannot be
    parsed as valid JSON with the required four keys — the caller catches
    this and falls back to rule-based generation.
    """
    # Prefer GROQ_API_KEY, but allow OPENAI_API_KEY for backward compatibility
    # with older project setup/docs.
    api_key = os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "Missing API key. Set GROQ_API_KEY (preferred) in your environment or .env file."
        )

    client = Groq(api_key=api_key)
    entity_summary = _build_entity_summary(categorized_entities)

    user_message = (
        f"Transcript:\n{transcription}\n\n"
        f"Extracted medical entities:\n{entity_summary}\n\n"
        "Generate the SOAP note as JSON."
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0.3,
        max_tokens=1000,
    )

    raw = response.choices[0].message.content

    # Strip markdown code fences that the model sometimes adds despite instructions.
    raw = raw.replace("```json", "").replace("```", "").strip()

    soap = json.loads(raw)

    # Validate the four required keys are present.
    required_keys = {"subjective", "objective", "assessment", "plan"}
    missing = required_keys - soap.keys()
    if missing:
        raise ValueError(f"Groq response missing required SOAP keys: {missing}")

    return soap


# ---------------------------------------------------------------------------
# Rule-based fallback path (preserved from original implementation)
# ---------------------------------------------------------------------------

def _generate_fallback(transcription: str, categorized_entities: dict) -> dict:
    """
    Rule-based SOAP generation used when the GPT call fails.
    Produces a structured dict rather than clinical prose — the frontend
    renders both shapes correctly.
    """
    symptoms = categorized_entities.get("symptoms", [])
    conditions = categorized_entities.get("conditions", [])
    medications = categorized_entities.get("medications", [])
    procedures = categorized_entities.get("procedures", [])

    return {
        "generated_at": datetime.now().isoformat(),
        "source": "rule-based-fallback",
        "subjective": _fallback_subjective(transcription, symptoms),
        "objective": _fallback_objective(procedures),
        "assessment": _fallback_assessment(conditions),
        "plan": _fallback_plan(medications, procedures),
    }


def _fallback_subjective(transcription: str, symptoms: list) -> dict:
    symptom_list = [s["text"] for s in symptoms]
    chief_complaint = (
        "Patient reports: " + ", ".join(symptom_list)
        if symptom_list
        else "No specific complaints documented."
    )
    return {
        "chief_complaint": chief_complaint,
        "symptoms": symptom_list,
        "symptom_count": len(symptom_list),
        "narrative": transcription.strip(),
    }


def _fallback_objective(procedures: list) -> dict:
    procedure_list = [p["text"] for p in procedures]
    findings = []
    for proc in procedure_list:
        if proc in ("vitals", "vital signs"):
            findings.append("Vital signs monitored")
        elif proc in ("monitor", "monitoring"):
            findings.append("Patient under observation")
        else:
            findings.append(f"{proc.title()} performed")
    return {
        "findings": findings if findings else ["Physical examination performed"],
        "procedures": procedure_list,
        "procedure_count": len(procedure_list),
    }


def _fallback_assessment(conditions: list) -> dict:
    condition_list = [c["text"] for c in conditions]
    if condition_list:
        primary_diagnosis = condition_list[0]
        additional_diagnoses = condition_list[1:]
    else:
        primary_diagnosis = "Assessment pending further evaluation"
        additional_diagnoses = []
    return {
        "primary_diagnosis": primary_diagnosis,
        "additional_diagnoses": additional_diagnoses,
        "all_conditions": condition_list,
        "condition_count": len(condition_list),
    }


def _fallback_plan(medications: list, procedures: list) -> dict:
    medication_list = [m["text"] for m in medications]
    procedure_list = [p["text"] for p in procedures]
    plan_items = []
    if medication_list:
        plan_items.append(f"Medications: {', '.join(medication_list)}")
    if procedure_list:
        plan_items.append(f"Procedures: {', '.join(procedure_list)}")
    if not plan_items:
        plan_items.append("Continue monitoring and supportive care")
    return {
        "treatment_plan": plan_items,
        "medications": medication_list,
        "follow_up_procedures": procedure_list,
        "medication_count": len(medication_list),
        "follow_up": "Schedule follow-up appointment as needed",
    }


# ---------------------------------------------------------------------------
# Text formatting utility (kept for export / debug use)
# ---------------------------------------------------------------------------

def format_soap_note_text(soap_note: dict) -> str:
    """
    Format a SOAP note dict as readable plain text.
    Handles both the GPT string shape and the fallback dict shape.
    """
    lines = []
    lines.append("=" * 60)
    lines.append("SOAP NOTE")
    lines.append(f"Generated: {soap_note.get('generated_at', 'unknown')}")
    source = soap_note.get("source", "unknown")
    lines.append(f"Source: {source}")
    lines.append("=" * 60)
    lines.append("")

    for section in ("subjective", "objective", "assessment", "plan"):
        lines.append(f"{section.upper()}:")
        value = soap_note.get(section, "")
        if isinstance(value, str):
            # GPT path — plain prose paragraph
            lines.append(f"  {value}")
        elif isinstance(value, dict):
            # Fallback path — structured dict
            for k, v in value.items():
                if isinstance(v, list):
                    lines.append(f"  {k}: {', '.join(str(i) for i in v)}")
                else:
                    lines.append(f"  {k}: {v}")
        lines.append("")

    lines.append("=" * 60)
    return "\n".join(lines)
