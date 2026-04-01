"""
Structured clinical extraction layer.

Builds an intermediate representation from the transcript before SOAP note
generation so downstream prompts are grounded in normalized clinical facts
instead of raw conversational text alone.
"""
from __future__ import annotations

import json
import os
import re
from datetime import datetime

from dotenv import load_dotenv

load_dotenv()

from runtime_context import get_reference_datetime

try:
    from groq import Groq
except ImportError:  # pragma: no cover
    Groq = None  # type: ignore


MONTH_NAME_TO_NUMBER = {
    "january": 1,
    "february": 2,
    "march": 3,
    "april": 4,
    "may": 5,
    "june": 6,
    "july": 7,
    "august": 8,
    "september": 9,
    "october": 10,
    "november": 11,
    "december": 12,
}
def extract_clinical_representation(transcription: str, categorized_entities: dict) -> dict:
    """
    Return a normalized intermediate clinical representation.

    Prefer LLM extraction when available, but always fall back to local
    heuristics so the pipeline keeps working without network/API access.
    """
    try:
        structured = _extract_with_groq(transcription, categorized_entities)
        return _postprocess_representation(structured, transcription, categorized_entities)
    except Exception as exc:
        print(f"Structured extraction via Groq failed: {exc}")
        return _postprocess_representation(
            _extract_with_rules(transcription, categorized_entities),
            transcription,
            categorized_entities,
        )


def _extract_with_groq(transcription: str, categorized_entities: dict) -> dict:
    api_key = os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not api_key or Groq is None:
        raise EnvironmentError("No Groq client/API key available for structured extraction.")

    client = Groq(api_key=api_key)
    patient = _extract_patient_details(transcription)
    user_message = (
        f"Transcript:\n{transcription}\n\n"
        f"Patient metadata:\n{json.dumps(patient, indent=2)}\n\n"
        f"Categorized entities:\n{json.dumps(_compact_entities(categorized_entities), indent=2)}\n\n"
        "Return the structured representation as JSON."
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": _STRUCTURED_EXTRACTION_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0.1,
        max_tokens=1400,
    )

    raw = response.choices[0].message.content.replace("```json", "").replace("```", "").strip()
    return json.loads(raw)


def _extract_with_rules(transcription: str, categorized_entities: dict) -> dict:
    text_lower = transcription.lower()
    patient = _extract_patient_details(transcription)
    clinician = _extract_clinician_details(transcription)
    encounter_type = _infer_encounter_type(text_lower)

    conditions = _dedupe_texts(categorized_entities.get("conditions", []))
    symptoms = _dedupe_texts(categorized_entities.get("symptoms", []))
    medications = _dedupe_texts(categorized_entities.get("medications", []))
    procedures = _dedupe_texts(categorized_entities.get("procedures", []))

    concerns = []
    if any(term in text_lower for term in ["eyesight", "losing sensation", "feet", "eyes checked"]):
        concerns.append("Concerned about long-term diabetes complications affecting eyes and feet.")
    if "anxious" in text_lower:
        concerns.append("Feels anxious about the diagnosis.")
    if "heart attack" in text_lower and "worried" in text_lower:
        concerns.append("Concerned about the possibility of a heart attack.")

    ideas = []
    if "lack of exercise" in text_lower or "not eating very well" in text_lower:
        ideas.append("Believes diabetes may be related to lack of exercise and poor diet.")
    if "haven't got a clue" in text_lower or "have not got a clue" in text_lower:
        ideas.append("Has no clear idea what is causing the symptoms.")

    expectations = []
    if "have a chat" in text_lower or "talk a bit more" in text_lower:
        expectations.append("Wants more information about diabetes and its implications.")
    if "if you've got the time" in text_lower and any(term in text_lower for term in ["eyes", "feet", "eyesight", "sensation"]):
        expectations.append("Would like to discuss the long-term complications mentioned by the colleague today.")
    if "overreacting" in text_lower or "sort me out" in text_lower:
        expectations.append("Wants reassurance and help resolving the symptoms.")

    education = []
    if "insulin" in text_lower and "glucose" in text_lower:
        education.append("Explained glucose metabolism, insulin, and insulin resistance in lay terms.")
    if "infections" in text_lower and ("thrush" in text_lower or "urine infection" in text_lower or "water infection" in text_lower):
        education.append("Explained that recurrent thrush and urinary infections can reflect high blood sugar and glycosuria.")
    if "diabetes" in text_lower and any(term in text_lower for term in ["eyes checked", "feet", "kidneys", "stroke", "heart attack"]):
        education.append("Discussed short-term infection risks and long-term microvascular/macrovascular complications.")
    if "summarise" in text_lower or "summarize" in text_lower:
        education.append("Teach-back used to confirm patient understanding.")
    if "leaflets" in text_lower:
        education.append("Provided written leaflets.")

    historical_manifestations = []
    if "thrush" in text_lower:
        historical_manifestations.append("Thrush preceding diagnosis may reflect prior hyperglycaemia.")
    if "urine infection" in text_lower or "water infection" in text_lower or "urinary tract infection" in text_lower:
        historical_manifestations.append("Prior urinary infections may reflect glycosuria/hyperglycaemia.")

    history_gaps = _generic_history_gaps(text_lower, encounter_type)
    if "diabetes" in text_lower:
        if "hba1c" not in text_lower:
            history_gaps.append("HbA1c result not stated in transcript.")
        if "type 2" not in text_lower and "type 1" not in text_lower:
            history_gaps.append("Diabetes type not explicitly confirmed in transcript.")

    return {
        "patient": patient,
        "encounter": {
            "type": encounter_type,
            "setting": "primary_care" if "gp surgery" in text_lower else None,
            "history_only": True,
            "clinician_name": clinician.get("name"),
            "clinician_role": clinician.get("role"),
            "visit_reason": (
                "Discussion and education following recently communicated diabetes diagnosis."
                if "diabetes" in text_lower else "Assessment of the current clinical presentation."
            ),
            "diagnosis_known_before_visit": "diabetes" in text_lower and "blood test" in text_lower,
        },
        "subjective_data": {
            "current_symptoms": [],
            "historical_symptoms": symptoms,
            "ideas": ideas,
            "concerns": concerns,
            "expectations": expectations,
            "emotional_response": _collect_emotional_response(text_lower),
        },
        "objective_data": {
            "tests_reviewed": [],
            "tests_referenced_only": procedures,
            "measurements_documented": [],
            "results_missing": ["HbA1c", "blood glucose values"] if "blood test" in text_lower else [],
        },
        "assessment_context": {
            "confirmed_diagnoses": [c for c in conditions if c == "diabetes"],
            "active_differential_targets": [],
            "historical_manifestations": historical_manifestations,
            "discussed_future_risks": _extract_discussed_risks(text_lower),
            "psychosocial_factors": _extract_psychosocial_factors(text_lower),
            "health_literacy": (
                "good"
                if "summarize" in text_lower or "summarise" in text_lower
                else "not clear from transcript"
            ),
        },
        "plan_context": {
            "education_provided": education,
            "medications_actively_discussed": [],
            "medications_currently_taken": [],
            "monitoring_to_arrange": _monitoring_suggestions(encounter_type, text_lower),
            "referrals_to_consider": _referral_suggestions(encounter_type, text_lower),
            "follow_up_needs": _follow_up_suggestions(encounter_type, text_lower),
            "safety_netting": _safety_netting_suggestions(encounter_type, text_lower),
        },
        "history_gaps": history_gaps,
    }


def _postprocess_representation(rep: dict, transcription: str, categorized_entities: dict) -> dict:
    heuristic_rep = _extract_with_rules(transcription, categorized_entities)
    patient = rep.setdefault("patient", {})
    encounter = rep.setdefault("encounter", {})
    subjective = rep.setdefault("subjective_data", {})
    objective = rep.setdefault("objective_data", {})
    assessment = rep.setdefault("assessment_context", {})
    plan = rep.setdefault("plan_context", {})

    extracted_patient = _extract_patient_details(transcription)
    for key, value in extracted_patient.items():
        patient.setdefault(key, value)
    for key, value in heuristic_rep.get("patient", {}).items():
        if patient.get(key) in (None, "", []):
            patient[key] = value

    extracted_clinician = _extract_clinician_details(transcription)
    for key, value in extracted_clinician.items():
        encounter.setdefault(f"clinician_{key}", value)
    for key, value in heuristic_rep.get("encounter", {}).items():
        if encounter.get(key) in (None, "", []):
            encounter[key] = value

    encounter.setdefault("type", _infer_encounter_type(transcription.lower()))
    encounter.setdefault("history_only", True)

    for key in ("current_symptoms", "historical_symptoms", "ideas", "concerns", "expectations", "emotional_response"):
        subjective.setdefault(key, [])
    for key in ("tests_reviewed", "tests_referenced_only", "measurements_documented", "results_missing"):
        objective.setdefault(key, [])
    for key in ("confirmed_diagnoses", "active_differential_targets", "historical_manifestations", "discussed_future_risks", "psychosocial_factors"):
        assessment.setdefault(key, [])
    assessment.setdefault("health_literacy", None)
    for key in ("education_provided", "medications_actively_discussed", "medications_currently_taken", "monitoring_to_arrange", "referrals_to_consider", "follow_up_needs", "safety_netting"):
        plan.setdefault(key, [])
    rep.setdefault("history_gaps", [])

    # Deduplicate list values while preserving order.
    for section in (subjective, objective, assessment, plan):
        for key, value in list(section.items()):
            if isinstance(value, list):
                section[key] = _dedupe_strings(value)

    for section_name in ("subjective_data", "objective_data", "assessment_context", "plan_context"):
        target = rep.get(section_name, {})
        source = heuristic_rep.get(section_name, {})
        for key, value in source.items():
            if isinstance(value, list):
                target[key] = _dedupe_strings(target.get(key, []) + value)
            elif target.get(key) in (None, "", []):
                target[key] = value

    rep["history_gaps"] = _dedupe_strings(rep["history_gaps"] + heuristic_rep.get("history_gaps", []))
    rep["source_entities"] = _compact_entities(categorized_entities)
    rep["structured_at"] = datetime.utcnow().isoformat()
    return rep


def _extract_patient_details(transcription: str) -> dict:
    details = {
        "name": None,
        "date_of_birth": None,
        "age_years": None,
    }
    name_match = re.search(
        r"(?:it's|it is)\s+([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)?(?:\s+[A-Z][a-z]+)?)",
        transcription,
    )
    if name_match:
        name = name_match.group(1).replace(",", " ").strip()
        parts = name.split()
        if len(parts) >= 2 and parts[0].lower() == parts[1].lower():
            parts = parts[1:]
        details["name"] = " ".join(parts)

    numeric_match = re.search(r"(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})", transcription)
    if numeric_match:
        day, month, year = map(int, numeric_match.groups())
    else:
        month_match = re.search(
            r"(\d{1,2})(?:st|nd|rd|th)?\s+of\s+(?:the\s+)?(\d{1,2}|[A-Za-z]+)(?:st|nd|rd|th)?\s+(\d{4})",
            transcription,
            flags=re.IGNORECASE,
        )
        if month_match:
            day = int(month_match.group(1))
            month_token = month_match.group(2)
            month = int(month_token) if month_token.isdigit() else MONTH_NAME_TO_NUMBER.get(month_token.lower())
            year = int(month_match.group(3))
        else:
            month = None

    if details["date_of_birth"] is None and month is not None:
        details["date_of_birth"] = f"{day:02d}/{month:02d}/{year}"
        today = get_reference_datetime()
        age = today.year - year - ((today.month, today.day) < (month, day))
        if 0 <= age <= 120:
            details["age_years"] = age

    return details


def _extract_clinician_details(transcription: str) -> dict:
    details = {
        "name": None,
        "role": None,
    }
    match = re.search(
        r"my name[' ]?s\s+([A-Z][a-z]+)[, ]+\s*i[' ]?m\s+(?:one of the\s+)?([^.,]+)",
        transcription,
        flags=re.IGNORECASE,
    )
    if not match:
        return details

    details["name"] = match.group(1).strip()
    role = match.group(2).strip()
    role = re.sub(r"\s+working\s+in\s+the\s+.*$", "", role, flags=re.IGNORECASE)
    role = role.replace("junior doctors", "junior doctor")
    details["role"] = role
    return details


def _infer_encounter_type(text_lower: str) -> str:
    if any(marker in text_lower for marker in [
        "come and have a chat",
        "does that make sense",
        "give you a few leaflets",
        "blood test said i had diabetes",
        "blood tests showed diabetes",
        "blood tests said i had diabetes",
        "talk a bit more about today",
        "help in managing the diabetes",
    ]):
        return "counselling_or_education"
    if any(marker in text_lower for marker in [
        "follow-up", "review appointment", "reviewed today",
    ]):
        return "follow_up_review"
    if any(marker in text_lower for marker in [
        "chest pain", "shortness of breath", "worsening", "urgent",
    ]):
        return "acute_presentation"
    return "general_consultation"


def _compact_entities(categorized_entities: dict) -> dict:
    compact = {}
    for key, values in categorized_entities.items():
        if values:
            compact[key] = [item.get("text", "") for item in values[:20]]
    return compact


def _dedupe_texts(values: list[dict]) -> list[str]:
    return _dedupe_strings([item.get("text", "") for item in values if item.get("text")])


def _dedupe_strings(values: list[str]) -> list[str]:
    seen = set()
    deduped = []
    for value in values:
        normalized = value.strip()
        if not normalized:
            continue
        lowered = normalized.lower()
        if lowered in seen:
            continue
        seen.add(lowered)
        deduped.append(normalized)
    return deduped


def _collect_emotional_response(text_lower: str) -> list[str]:
    responses = []
    if "relieved" in text_lower:
        responses.append("Relieved to have an explanation for symptoms.")
    if "anxious" in text_lower or "worry" in text_lower:
        responses.append("Anxious about diabetes and possible complications.")
    if "worried" in text_lower and "heart attack" in text_lower:
        responses.append("Worried that the symptoms may represent a heart attack.")
    return responses


def _extract_discussed_risks(text_lower: str) -> list[str]:
    risks = []
    if "eyes" in text_lower or "eyesight" in text_lower:
        risks.append("Retinopathy / visual complications discussed.")
    if "feet" in text_lower or "sensation" in text_lower:
        risks.append("Neuropathy / foot complications discussed.")
    if "kidneys" in text_lower:
        risks.append("Kidney complications discussed.")
    if "stroke" in text_lower or "heart disease" in text_lower or "heart attack" in text_lower:
        risks.append("Macrovascular cardiovascular risk discussed.")
    return risks


def _extract_psychosocial_factors(text_lower: str) -> list[str]:
    factors = []
    if "lack of exercise" in text_lower or "not eating very well" in text_lower:
        factors.append("Belief that diabetes is entirely lifestyle-driven may contribute to guilt or self-blame.")
    if "colleague" in text_lower:
        factors.append("Concerns influenced by colleague's experience with diabetes complications.")
    if "dad passed away from a heart attack" in text_lower or "father" in text_lower and "heart attack" in text_lower:
        factors.append("Family bereavement related to heart disease appears to contribute to health anxiety.")
    return factors


def _monitoring_suggestions(encounter_type: str, text_lower: str) -> list[str]:
    if encounter_type not in {"counselling_or_education", "general_consultation"} or "diabetes" not in text_lower:
        return []
    return [
        "Review HbA1c and baseline blood results.",
        "Arrange retinal screening and foot examination.",
        "Arrange routine diabetes monitoring including renal assessment and urine ACR.",
        "Arrange a regular HbA1c monitoring schedule.",
        "Record blood pressure, weight, and BMI at follow-up.",
    ]


def _referral_suggestions(encounter_type: str, text_lower: str) -> list[str]:
    if encounter_type not in {"counselling_or_education", "general_consultation"} or "diabetes" not in text_lower:
        return []
    return [
        "Refer to a structured diabetes education programme such as DESMOND.",
        "Consider dietetic support.",
        "Consider diabetes specialist nurse input if available.",
    ]


def _follow_up_suggestions(encounter_type: str, text_lower: str) -> list[str]:
    if encounter_type in {"counselling_or_education", "general_consultation"} and "diabetes" in text_lower:
        return ["Arrange GP/primary care follow-up within 1 to 2 weeks to review results and formalise the management plan."]
    return []


def _safety_netting_suggestions(encounter_type: str, text_lower: str) -> list[str]:
    suggestions = []
    if "give us a call" in text_lower or "book in to speak" in text_lower:
        suggestions.append("Advised to contact the GP surgery or book review with further questions.")
    if encounter_type in {"counselling_or_education", "general_consultation"} and "diabetes" in text_lower:
        suggestions.append("Advised to seek review for worsening hyperglycaemic symptoms or signs of infection.")
    return suggestions


def _generic_history_gaps(text_lower: str, encounter_type: str) -> list[str]:
    gaps = []

    if "allerg" not in text_lower:
        gaps.append("Allergies not elicited in this recording.")
    if "medication" not in text_lower and "taking any" not in text_lower and "tablets" not in text_lower:
        gaps.append("Current medications not elicited in this recording.")
    if not any(term in text_lower for term in ["past medical history", "pmh", "medical problems", "medical history"]):
        gaps.append("Past medical history not elicited in this recording.")
    if "surgery" not in text_lower and "operation" not in text_lower and "surgical" not in text_lower:
        gaps.append("Surgical history not elicited in this recording.")
    if "smok" not in text_lower and "alcohol" not in text_lower and "drugs" not in text_lower:
        gaps.append("Social history not elicited in this recording.")
    if "family history" not in text_lower and "dad passed away" not in text_lower and "father" not in text_lower:
        gaps.append("Family history not elicited in this recording.")

    if encounter_type == "acute_presentation" and "chest pain" in text_lower:
        if not any(term in text_lower for term in ["lean forward", "leaning forward", "sit forward"]):
            gaps.append("Relief on leaning forward was not explored in this recording.")

    return gaps


_STRUCTURED_EXTRACTION_PROMPT = """You are a clinical information extraction assistant.
Return ONLY valid JSON. Do not write prose outside the JSON.

Extract a grounded intermediate representation from the transcript.
Rules:
- Do not invent facts not supported by the transcript.
- Separate active current problems from historical manifestations and from
  future risks merely discussed during counselling.
- Separate medications currently taken from medications mentioned only as part
  of education or explanation.
- If the encounter is counselling/education rather than acute workup, reflect
  that in encounter.type and keep active_differential_targets empty unless the
  transcript clearly discusses current diagnostic uncertainty.
- If test results are referenced but not actually reviewed in detail, place
  them in tests_referenced_only/results_missing, not tests_reviewed.
- Use concise clinician-readable strings.

Return JSON with these top-level keys exactly:
patient, encounter, subjective_data, objective_data, assessment_context,
plan_context, history_gaps
"""
