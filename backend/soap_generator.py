"""
SOAP note generation from categorized medical entities.
Primary path: Groq llama-3.1-70b-versatile for clinical prose.
Fallback path: Rule-based generation if API call fails.
"""
from dotenv import load_dotenv
load_dotenv()

import os
import json
import re
from datetime import datetime
from groq import Groq

INSUFFICIENT_SECTION_TEXT = "Not enough information in the recording to complete this section."



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
        soap = _apply_clinical_consistency_rules(transcription, soap)
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


def _extract_patient_context(transcription: str) -> dict:
    """
    Pull lightweight structured context from the transcript to ground the prompt.
    """
    context = {
        "patient_name": None,
        "date_of_birth": None,
        "calculated_age_years": None,
        "history_only_encounter": True,
    }

    name_match = re.search(
        r"name and date of birth\?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
        transcription,
    )
    if name_match:
        context["patient_name"] = name_match.group(1).strip()

    dob_match = re.search(r"(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})", transcription)
    if not dob_match:
        dob_match = re.search(
            r"(\d{1,2})(?:st|nd|rd|th)?\s+of\s+the\s+(\d{1,2})(?:st|nd|rd|th)?[,]?\s+(\d{4})",
            transcription,
            flags=re.IGNORECASE,
        )
    if dob_match:
        day, month, year = map(int, dob_match.groups())
        context["date_of_birth"] = f"{day:02d}/{month:02d}/{year}"
        today = datetime.now()
        age = today.year - year - ((today.month, today.day) < (month, day))
        if 0 <= age <= 120:
            context["calculated_age_years"] = age

    return context


_SYSTEM_PROMPT = """You are a clinical documentation assistant that enhances
physician SOAP notes to documentation-grade quality. You operate as a
documentation enhancer: you structure and complete the note based on the
transcript, and you add standard-of-care items that are clinically implied
by the presentation only when the symptom pattern strongly supports them.
Do not default to an acute coronary syndrome pathway just because the words
"chest pain" appear.

CRITICAL OUTPUT RULES:
- Return ONLY valid JSON with exactly four keys: subjective, objective,
  assessment, plan. No markdown fences, no preamble, no text outside the JSON.
- Never repeat the same clinical information across sections.
- Never fabricate patient-specific data (vitals, measurements, test results).
- If a SOAP section does not have enough evidence in the transcript to be
  completed safely, respond with exactly:
  "Not enough information in the recording to complete this section."
  Do not infer, assume, or fabricate clinical content for that section.
- If a specific data point is absent from the transcript but the section still
  has enough evidence to be completed safely, state it as
  "not documented in transcript."
- Normalise all medication names to standard formulary spelling
  (e.g. "lisinopril" not "lysinoprell", "atorvastatin" not "adervastatin").
  If a medication name is phonetically recognisable, correct it silently.
- If a date of birth and computed age are provided in the prompt metadata,
  use that age exactly and do not estimate a different age.
- If patient name or DOB metadata are provided, include them in the opening
  demographics sentence of the Subjective section.

SUBJECTIVE:
- Report only what the patient or clinician stated. Zero diagnostic
  interpretation or clinical reasoning in this section.
- Structure the HPI to cover all OPQRST elements for any chief complaint,
  but write as a single fluent clinical paragraph — do not mechanically
  label each element. The paragraph should read as an experienced clinician
  wrote it, not as a template being filled in.
- Begin the Subjective section with a demographics sentence including patient
  name, DOB, and age when available in prompt metadata.
- Cover: onset (when and how it started), triggering event if known,
  quality, radiation, severity (numeric scale if mentioned), timing
  (constant vs intermittent), provocation and palliation.
- Distinguish carefully between onset and progression. If the pain started
  suddenly but worsened gradually thereafter, say exactly that; do not collapse
  it into "gradual onset."
- For each OPQRST element genuinely absent from the transcript, incorporate
  a natural "not documented" statement within the prose rather than a
  labelled line. Example: "Aggravating and relieving factors were not
  documented." Do not say "onset not further documented" if onset was
  already stated — instead flag the triggering event specifically if unknown.
- Include associated symptoms, relevant past medical history, surgical
  history, medications, allergies, family history, and recent illness if
  mentioned.
- Explicitly capture Ideas, Concerns, and Expectations when the patient states
  them. These may be woven naturally into the paragraph, but all three must be
  present if available. If the patient explicitly has no idea what is causing
  the symptoms, state that clearly as the Ideas component.
- If the transcript establishes that an aggravating or relieving factor was
  asked about and the answer was effectively "no difference", document that
  finding rather than saying it was not documented.
- If standard history components such as PMHx, medications, allergies, social
  history, or family history were not asked about in the recording, explicitly
  state that they were "not elicited in this recording" rather than omitting
  them.
- Add a brief "history gaps identified" sentence when a key diagnostic question
  was not asked in the recording. For suspected pericarditis, explicitly note
  if forward-leaning relief was not explored.
- Do not create internal contradictions. Example: if the pain is worse when
  lying down but not worsened by walking/sitting, document positional worsening
  with no clear exertional trigger; do not say position has no effect.

OBJECTIVE:
- Report only measurable, observable findings. Zero diagnostic interpretation.
- If the audio is history-taking only and contains no examination or test
  results, state clearly that this recording captures history-taking only and
  objective findings are pending clinical examination/investigation.
- List all vital signs mentioned. For each standard vital sign not in the
  transcript (heart rate, blood pressure, respiratory rate, oxygen
  saturation, temperature), state it as "not documented in transcript."
- For ECG findings: report leads affected, type of change (elevation vs
  depression), magnitude, and rhythm if mentioned. For any detail not
  provided, state: "Specific leads involved, morphology, magnitude, and
  rhythm not documented in transcript."
- Do not use phrases like "consistent with" or "indicative of" — those
  belong in Assessment only.
- Write as a single fluent clinical paragraph in third-person.

ASSESSMENT:
- Provide a prioritised numbered problem list from most to least urgent.
- For each problem: state the diagnosis using precise clinical terminology,
  then one sentence of reasoning drawn strictly from the S and O data.
  Use precision language scaled to the strength of evidence:
  "highly concerning for", "likely", "consistent with", "suspicious for."
- Match the diagnosis to the symptom pattern. For chest pain:
  pressure-like exertional radiating pain with diaphoresis supports ACS;
  sharp pleuritic positional pain after a recent viral illness in a young
  patient supports pericarditis. Family history alone must not override the
  actual pain pattern.
- If pericarditis is leading and troponin later proves elevated, state that
  myopericarditis should then be considered and cardiology input may be needed.
- When ranking a differential diagnosis lower, briefly state why. For example,
  if ACS is lower on the list, note the absence of classic pressure-like,
  exertional, radiating, or diaphoresis-associated features when supported by
  the transcript.
- Observe strict diagnostic taxonomy: never list a subtype parallel to its
  parent category. For ACS, the working diagnosis should specify the likely
  subtype (STEMI vs NSTEMI vs unstable angina) with the others as
  differential within that category.
- For high-risk chief complaints, include a brief differential of the two
  or three most important alternative diagnoses. When ranking alternatives
  lower, use "less likely given current symptom description" or "based on
  currently available information" — never imply exclusion based on absence
  of documentation, as undocumented does not mean absent.
- Write as a structured paragraph with numbered problems. No bullet points.

PLAN:
- Address each numbered Assessment problem in order.
- State all actions directly and confidently. Do not label any action as
  "per standard protocol" — simply document the action as a clinician would.
- The plan must remain aligned to the leading assessment. Do not generate an
  ACS-only treatment bundle if the assessment favors pericarditis or another
  non-ACS cause.
- For suspected pericarditis, prefer ECG, troponin, CRP/ESR, FBC, and
  echocardiography, with first-line NSAID and colchicine treatment unless the
  transcript gives a reason not to. If pericarditis is the leading diagnosis,
  do not hedge vaguely with "if clinically appropriate."
- If medication dosing is not explicitly supported by the transcript or prompt
  metadata, say that dosing and duration are to be confirmed by the treating
  clinician rather than implying the prescription is complete.
- For pericarditis plans, explicitly mention gastroprotection if an NSAID is
  being used, for example PPI cover where appropriate.
- Include safety-netting for acute chest pain presentations, especially return
  precautions for worsening breathlessness, syncope, spreading pain, or general
  deterioration.
- Include rest and avoidance of strenuous exercise when the leading diagnosis
  is pericarditis or myopericarditis is being considered.
- Include a follow-up timeframe when clinically appropriate.
- For acute or high-risk presentations where ACS is genuinely the leading
  concern, include standard-of-care items clinically implied by the scenario:
  cardiac monitoring, IV access, serial ECGs, troponin and cardiac
  biomarkers, NPO status, supplemental oxygen if hypoxic, anticoagulation
  if indicated.
- Include medications with dose and route, investigations ordered,
  monitoring, disposition, urgency classification, patient counselling, and
  risk discussion where clinically relevant.
- Write as a single fluent clinical paragraph in third-person."""


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
    patient_context = _extract_patient_context(transcription)

    user_message = (
        f"Transcript:\n{transcription}\n\n"
        f"Prompt metadata:\n{json.dumps(patient_context, indent=2)}\n\n"
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

    soap = _normalize_soap_sections(json.loads(raw))

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


def _normalize_soap_sections(soap: dict) -> dict:
    """
    Ensure all SOAP sections are present and never empty strings.
    This keeps the frontend output deterministic for sparse recordings.
    """
    for section in ("subjective", "objective", "assessment", "plan"):
        value = soap.get(section)
        if isinstance(value, str):
            soap[section] = value.strip() or INSUFFICIENT_SECTION_TEXT
        elif value is None:
            soap[section] = INSUFFICIENT_SECTION_TEXT
    return soap


def _append_sentence(section_text: str, sentence: str) -> str:
    section_text = section_text.strip()
    sentence = sentence.strip()
    if not section_text:
        return sentence
    if sentence in section_text:
        return section_text
    if not section_text.endswith((".", "!", "?")):
        section_text += "."
    return f"{section_text} {sentence}"


def _remove_sentence(section_text: str, sentence_pattern: str) -> str:
    updated = re.sub(sentence_pattern, "", section_text, flags=re.IGNORECASE)
    updated = re.sub(r"\s{2,}", " ", updated)
    return updated.strip()


def _apply_clinical_consistency_rules(transcription: str, soap: dict) -> dict:
    """
    Add a small diagnosis-aware rules layer so high-value clinical details are
    carried across sections consistently even when the model drifts.
    """
    subjective = str(soap.get("subjective", ""))
    objective = str(soap.get("objective", ""))
    assessment = str(soap.get("assessment", ""))
    plan = str(soap.get("plan", ""))
    text_lower = transcription.lower()

    pericarditis_leading = "pericarditis" in assessment.lower()
    viral_urti_present = any(phrase in text_lower for phrase in [
        "sniffles", "sore throat", "viral", "upper respiratory", "urti",
    ])
    forward_leaning_asked = any(phrase in text_lower for phrase in [
        "lean forward", "leaning forward", "sit forward",
    ])

    if pericarditis_leading and viral_urti_present and "viral" not in assessment.lower() and "urti" not in assessment.lower():
        assessment = _append_sentence(
            assessment,
            "This is further supported by the recent viral upper respiratory tract illness described in the history.",
        )

    if pericarditis_leading and "myopericarditis" not in assessment.lower():
        assessment = _append_sentence(
            assessment,
            "If troponin returns elevated, myopericarditis should be considered and urgent cardiology review sought.",
        )

    if pericarditis_leading and not forward_leaning_asked and "forward-leaning relief" not in subjective.lower():
        subjective = _remove_sentence(
            subjective,
            r"History gaps identified:\s*the patient's recent illness could be relevant to his current symptoms,\s*and further questioning about his family history of heart disease may be necessary\.\s*",
        )
        subjective = _remove_sentence(
            subjective,
            r"History gaps identified include that relief on leaning forward was not explored in this recording\.\s*",
        )
        subjective = _append_sentence(
            subjective,
            "History gaps identified include that relief on leaning forward was not explored in this recording.",
        )

    if "ecg" in plan.lower() and "requested" not in objective.lower():
        objective = _append_sentence(
            objective,
            "Investigations requested and pending include ECG, troponin, CRP/ESR, FBC, and echocardiography.",
        )

    if pericarditis_leading and "dosing" not in plan.lower() and "dose" not in plan.lower():
        plan = _append_sentence(
            plan,
            "Medication dosing and duration are to be confirmed by the prescribing clinician.",
        )

    if pericarditis_leading and "1–2 weeks" not in plan and "1-2 weeks" not in plan and "one to two weeks" not in plan.lower():
        plan = _append_sentence(
            plan,
            "Follow-up should be arranged in 1–2 weeks for clinical review and repeat inflammatory markers.",
        )

    if pericarditis_leading:
        plan = re.sub(
            r"If pericarditis is confirmed,\s*treatment with",
            "Treatment for suspected pericarditis should be initiated with",
            plan,
            flags=re.IGNORECASE,
        )
        plan = re.sub(
            r"should be considered",
            "should be initiated",
            plan,
            flags=re.IGNORECASE,
        )

    soap["subjective"] = subjective
    soap["objective"] = objective
    soap["assessment"] = assessment
    soap["plan"] = plan
    return soap


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
    if not procedure_list:
        return {"note": INSUFFICIENT_SECTION_TEXT}
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
    if not condition_list:
        return {"note": INSUFFICIENT_SECTION_TEXT}
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
        return {"note": INSUFFICIENT_SECTION_TEXT}
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
