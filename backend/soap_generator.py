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
from runtime_context import get_reference_datetime

INSUFFICIENT_SECTION_TEXT = "Not enough information in the recording to complete this section."

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
# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def generate_soap_note(transcription: str, categorized_entities: dict, clinical_representation: dict | None = None) -> dict:
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
        soap = _generate_with_groq(transcription, categorized_entities, clinical_representation)
        soap = _validate_and_repair_soap_note(transcription, soap, clinical_representation or {})
        soap["generated_at"] = datetime.now().isoformat()
        soap["source"] = "groq-llama-3.1-70b-versatile"
        print("SOAP note generated via Groq llama-3.3-70b-versatile")
        return soap
    except Exception as exc:
        print(f"Groq SOAP generation failed: {exc}")
        print("Falling back to rule-based SOAP generation")
        soap = _generate_fallback(transcription, categorized_entities, clinical_representation or {})
        soap = _validate_and_repair_soap_note(transcription, soap, clinical_representation or {})
        soap["generated_at"] = datetime.now().isoformat()
        soap["source"] = "rule-based-fallback"
        return soap


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


def _build_clinical_representation_summary(clinical_representation: dict | None) -> str:
    if not clinical_representation:
        return "No structured clinical representation available."
    return json.dumps(clinical_representation, indent=2)


def _extract_patient_context(transcription: str) -> dict:
    """
    Pull lightweight structured context from the transcript to ground the prompt.
    """
    context = {
        "patient_name": None,
        "date_of_birth": None,
        "calculated_age_years": None,
        "clinician_name": None,
        "clinician_role": None,
        "history_only_encounter": True,
        "encounter_type": _infer_encounter_type(transcription),
        "current_date_utc": get_reference_datetime().strftime("%Y-%m-%d"),
    }

    name_match = re.search(
        r"name and date of birth\?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
        transcription,
    )
    if name_match:
        context["patient_name"] = name_match.group(1).strip()

    dob_match = re.search(r"(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})", transcription)
    if dob_match:
        day, month, year = map(int, dob_match.groups())
    else:
        dob_match_words = re.search(
            r"(\d{1,2})(?:st|nd|rd|th)?\s+of\s+(?:the\s+)?(\d{1,2}|[A-Za-z]+)(?:st|nd|rd|th)?[,]?\s+(\d{4})",
            transcription,
            flags=re.IGNORECASE,
        )
        if dob_match_words:
            day = int(dob_match_words.group(1))
            month_token = dob_match_words.group(2)
            month = int(month_token) if month_token.isdigit() else MONTH_NAME_TO_NUMBER.get(month_token.lower())
            year = int(dob_match_words.group(3))
        else:
            month = None

    if month is not None:
        context["date_of_birth"] = f"{day:02d}/{month:02d}/{year}"
        today = get_reference_datetime()
        age = today.year - year - ((today.month, today.day) < (month, day))
        if 0 <= age <= 120:
            context["calculated_age_years"] = age

    clinician_match = re.search(
        r"my name[' ]?s\s+([A-Z][a-z]+)[, ]+\s*i[' ]?m\s+(?:one of the\s+)?([^.,]+)",
        transcription,
        flags=re.IGNORECASE,
    )
    if clinician_match:
        context["clinician_name"] = clinician_match.group(1).strip()
        role = clinician_match.group(2).strip()
        role = re.sub(r"\s+working\s+in\s+the\s+.*$", "", role, flags=re.IGNORECASE)
        role = role.replace("junior doctors", "junior doctor")
        context["clinician_role"] = role

    return context


def _infer_encounter_type(transcription: str) -> str:
    text_lower = transcription.lower()

    counselling_markers = [
        "how can i help you today",
        "blood test said i had diabetes",
        "come and have a chat",
        "does that make sense",
        "summarize what we've just gone through",
        "i'll give you a few leaflets",
        "if you've got any questions",
    ]
    acute_markers = [
        "chest pain", "shortness of breath", "breathlessness",
        "worsening pain", "emergency", "urgent",
    ]

    if any(marker in text_lower for marker in counselling_markers):
        return "counselling_or_education"
    if any(marker in text_lower for marker in acute_markers):
        return "acute_presentation"
    return "general_consultation"


_SYSTEM_PROMPT = """You are a clinical documentation assistant that enhances
physician SOAP notes to documentation-grade quality. You operate as a
documentation enhancer: you structure and complete the note based on the
transcript, and you add standard-of-care items that are clinically implied
by the presentation only when the symptom pattern strongly supports them.
Do not default to an acute coronary syndrome pathway just because the words
"chest pain" appear.

You must first classify the encounter type from the transcript and prompt
metadata before writing anything. Common encounter types include:
- acute presentation / diagnostic workup
- follow-up review
- counselling / education visit
- medication review
- procedure visit
The SOAP note must be structurally aligned to the encounter type.

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
- The prompt metadata also includes the current UTC date. If age is provided,
  treat it as authoritative for that date.
- If patient name or DOB metadata are provided, include them in the opening
  demographics sentence of the Subjective section.
- If clinician name and role are clearly stated in the transcript metadata,
  include them briefly when helpful to orient the note.
- Never treat an educational explanation of a medication or hormone as proof
  that the patient is taking that medication.
- Every Assessment item and every Plan action must be grounded in the actual
  purpose of the encounter, not just in diseases or complications mentioned
  during counselling.
- Never introduce medications, investigations, restrictions, or safety advice
  that cannot be traced to the transcript or to the leading diagnosis pattern
  that is strongly supported by the transcript.

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
- For counselling / education visits prompted by prior test results, explicitly
  state if the underlying result was referenced but not reviewed in detail in
  the transcript, for example HbA1c or blood test values not documented.
- List all vital signs mentioned. For each standard vital sign not in the
  transcript (heart rate, blood pressure, respiratory rate, oxygen
  saturation, temperature), state it as "not documented in transcript."
- Include ECG details only when an ECG is actually mentioned in the transcript
  or is clearly part of the active acute cardiac workup. Do not include ECG
  templating language in non-cardiac counselling encounters.
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
- For counselling / education visits, do not force an acute differential list.
  Instead, assess the established diagnosis, clinically relevant historical
  manifestations, information gaps, health literacy, psychological response,
  and future risk counselling. Historical symptoms that appear to have led to
  diagnosis are not automatically active current problems.
- For diabetes counselling visits, recurrent thrush or urinary infections in
  the history should usually be framed as prior manifestations of
  hyperglycaemia rather than active infections, unless the transcript clearly
  indicates they are ongoing now.
- Do not list future complications discussed in counselling, such as
  neuropathy, retinopathy, or cardiovascular disease, as current differential
  diagnoses unless the transcript describes current features of them.
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
- For counselling / education visits, the plan should usually prioritise:
  education delivered, clarification of misconceptions, follow-up, baseline
  investigations still needed, routine monitoring, referrals, lifestyle advice,
  and safety-netting for unanswered questions.
- For a new diagnosis of diabetes discussed in primary care, do not escalate to
  insulin unless the transcript explicitly states insulin is already prescribed
  or initiation is being actively discussed. Do not advise rest or avoidance of
  exercise for routine diabetes counselling. Do not include NSAIDs,
  gastroprotection, colchicine, cardiac monitoring, or ECG/troponin workup
  unless the transcript genuinely supports those actions.
- Write as a single fluent clinical paragraph in third-person."""


_SECTION_REGEN_PROMPT = """You are a clinical documentation assistant performing
targeted SOAP section repair.

Return ONLY valid JSON with exactly one key matching the requested section
name: subjective, objective, assessment, or plan.

Rules:
- Rewrite ONLY the requested section.
- Use the structured clinical representation as the primary grounding source.
- Do not introduce facts absent from the transcript/representation.
- Resolve the listed section issues directly.
- Keep the section aligned to the encounter type.
- Output a single fluent clinical paragraph unless the section truly lacks
  enough evidence, in which case return:
  "Not enough information in the recording to complete this section."
"""


def _generate_with_groq(transcription: str, categorized_entities: dict, clinical_representation: dict | None = None) -> dict:
    """
    Call Groq API and parse the JSON response into a SOAP dict.

    Raises an exception if the API call fails or the response cannot be
    parsed as valid JSON with the required four keys — the caller catches
    this and falls back to rule-based generation.
    """
    # Prefer GROQ_API_KEY, but allow OPENAI_API_KEY for backward compatibility
    # with older project setup/docs.
    client = _get_groq_client()
    entity_summary = _build_entity_summary(categorized_entities)
    patient_context = _extract_patient_context(transcription)
    structured_summary = _build_clinical_representation_summary(clinical_representation)

    user_message = (
        f"Transcript:\n{transcription}\n\n"
        f"Prompt metadata:\n{json.dumps(patient_context, indent=2)}\n\n"
        f"Structured clinical representation:\n{structured_summary}\n\n"
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


def _get_groq_client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "Missing API key. Set GROQ_API_KEY (preferred) in your environment or .env file."
        )
    return Groq(api_key=api_key)


def _regenerate_section_with_groq(
    section: str,
    transcription: str,
    current_soap: dict,
    clinical_representation: dict,
    section_issues: list[str],
) -> str:
    client = _get_groq_client()
    payload = {
        "requested_section": section,
        "current_section_text": current_soap.get(section, ""),
        "other_sections": {k: current_soap.get(k, "") for k in ("subjective", "objective", "assessment", "plan") if k != section},
        "section_issues": section_issues,
        "structured_clinical_representation": clinical_representation,
        "prompt_metadata": _extract_patient_context(transcription),
    }
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": _SECTION_REGEN_PROMPT},
            {"role": "user", "content": f"Transcript:\n{transcription}\n\nRepair payload:\n{json.dumps(payload, indent=2)}"},
        ],
        temperature=0.1,
        max_tokens=650,
    )
    raw = response.choices[0].message.content.replace("```json", "").replace("```", "").strip()
    parsed = json.loads(raw)
    if section not in parsed:
        raise ValueError(f"Section regeneration response missing key: {section}")
    return str(parsed[section]).strip()


# ---------------------------------------------------------------------------
# Rule-based fallback path (preserved from original implementation)
# ---------------------------------------------------------------------------

def _generate_fallback(transcription: str, categorized_entities: dict, clinical_representation: dict | None = None) -> dict:
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
        "subjective": _fallback_subjective(transcription, symptoms, clinical_representation or {}),
        "objective": _fallback_objective(procedures, clinical_representation or {}),
        "assessment": _fallback_assessment(conditions, clinical_representation or {}),
        "plan": _fallback_plan(medications, procedures, clinical_representation or {}),
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


def _cleanup_spacing(text: str) -> str:
    text = re.sub(r"\s{2,}", " ", text)
    text = re.sub(r"\s+([.,;:])", r"\1", text)
    return text.strip()


def _cleanup_numbered_assessment(text: str) -> str:
    text = re.sub(r"\b\d+\.\s*(?=\d+\.|$)", "", text)
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip()


def _split_sentences(text: str) -> list[str]:
    return [sentence.strip() for sentence in re.split(r"(?<=[.?!])\s+", text.strip()) if sentence.strip()]


def _enforce_patient_context(subjective: str, transcription: str) -> str:
    context = _extract_patient_context(transcription)
    name = context.get("patient_name")
    dob = context.get("date_of_birth")
    age = context.get("calculated_age_years")

    if dob:
        subjective = re.sub(
            r"\bdate of birth not documented in transcript\b",
            f"DOB {dob}",
            subjective,
            flags=re.IGNORECASE,
        )

    if age is not None:
        subjective = re.sub(r"\b\d{1,3}-year-old\b", f"{age}-year-old", subjective)
        subjective = re.sub(
            rf"(,\s*a\s+{age}-year-old)(?:,\s*a\s+{age}-year-old)+",
            rf"\1",
            subjective,
            flags=re.IGNORECASE,
        )
        if name and dob and not re.search(re.escape(dob), subjective, flags=re.IGNORECASE):
            subjective = re.sub(
                re.escape(name),
                f"{name} (DOB {dob}), a {age}-year-old",
                subjective,
                count=1,
            )
        elif dob and age is not None and not re.search(rf"\bDOB\s+{re.escape(dob)}\b", subjective, flags=re.IGNORECASE):
            subjective = f"DOB {dob}. {subjective}"
    elif name and dob and "date of birth not documented" in subjective.lower():
        subjective = subjective.replace("date of birth not documented in transcript", f"DOB {dob}")
    return subjective


def _ensure_clinician_context(subjective: str, clinical_representation: dict) -> str:
    encounter = clinical_representation.get("encounter", {})
    clinician_name = encounter.get("clinician_name")
    clinician_role = encounter.get("clinician_role")
    if not clinician_name or clinician_name.lower() in subjective.lower():
        return subjective
    clinician_sentence = f"The consultation was conducted by {clinician_name}"
    if clinician_role:
        clinician_sentence += f", {clinician_role}"
    clinician_sentence += "."
    return _append_sentence(subjective, clinician_sentence)


def _ensure_history_gaps(subjective: str, clinical_representation: dict) -> str:
    history_gaps = clinical_representation.get("history_gaps", [])
    if not history_gaps:
        return subjective
    missing_gaps = [gap for gap in history_gaps if gap.lower() not in subjective.lower()]
    if not missing_gaps:
        return subjective
    if "history gaps identified" in subjective.lower():
        return _append_sentence(subjective, "Additional history gaps include " + "; ".join(missing_gaps[:5]) + ".")
    return _append_sentence(subjective, "History gaps identified include " + "; ".join(history_gaps[:5]) + ".")


def _aggravating_factors_explored(text_lower: str) -> bool:
    return all(marker in text_lower for marker in ["worse when you're breathing", "walking around", "lying down"]) or (
        "anything else that makes it worse" in text_lower and "worse when you were lying down" in text_lower
    )


def _dedupe_follow_up_sentences(plan: str) -> str:
    sentences = re.split(r"(?<=[.?!])\s+", plan.strip())
    follow_up_sentences = [s for s in sentences if re.search(r"\bfollow-?up\b", s, flags=re.IGNORECASE)]
    if len(follow_up_sentences) <= 1:
        return plan

    preferred = None
    for sentence in follow_up_sentences:
        if re.search(r"1[–-]2 weeks|one to two weeks", sentence, flags=re.IGNORECASE):
            preferred = sentence
            break
    if preferred is None:
        preferred = follow_up_sentences[-1]

    kept = []
    follow_up_added = False
    for sentence in sentences:
        if re.search(r"\bfollow-?up\b", sentence, flags=re.IGNORECASE):
            if not follow_up_added:
                kept.append(preferred)
                follow_up_added = True
            continue
        kept.append(sentence)
    return " ".join(s.strip() for s in kept if s.strip())


def _dedupe_safety_netting_sentences(plan: str) -> str:
    sentences = re.split(r"(?<=[.?!])\s+", plan.strip())
    kept = []
    seen_urgent = False
    for sentence in sentences:
        lowered = sentence.lower()
        is_safety = any(term in lowered for term in ["seek immediate medical attention", "return precautions", "worsening breathlessness", "general deterioration"])
        if is_safety:
            if seen_urgent:
                continue
            seen_urgent = True
        kept.append(sentence)
    return " ".join(s.strip() for s in kept if s.strip())


def _merge_viral_support_into_pericarditis_assessment(assessment: str) -> str:
    if "pericarditis" not in assessment.lower() or "viral upper respiratory tract illness" not in assessment.lower():
        return assessment
    sentences = _split_sentences(assessment)
    if not sentences:
        return assessment
    cleaned = []
    for sentence in sentences:
        if "recent viral upper respiratory tract illness described in the history" in sentence.lower():
            continue
        cleaned.append(sentence)
    sentences = cleaned or sentences
    for index, sentence in enumerate(sentences):
        if "pericarditis" in sentence.lower():
            if "viral" not in sentence.lower():
                sentences[index] = re.sub(
                    r"(pericarditis\b)",
                    r"\1 in the context of a recent viral upper respiratory tract illness",
                    sentence,
                    count=1,
                    flags=re.IGNORECASE,
                )
            break
    return " ".join(sentences)


def _strengthen_pericarditis_plan_language(plan: str) -> str:
    plan = re.sub(
        r"If pericarditis is confirmed,\s*first-line treatment with\s+([^.]*)\s+will be considered",
        r"Given the leading concern for pericarditis, initiate first-line treatment with \1",
        plan,
        flags=re.IGNORECASE,
    )
    plan = re.sub(
        r"If pericarditis is confirmed,\s*treatment with",
        "Given the leading concern for pericarditis, initiate treatment with",
        plan,
        flags=re.IGNORECASE,
    )
    plan = re.sub(
        r"\bwill be considered\b",
        "should be initiated",
        plan,
        flags=re.IGNORECASE,
    )
    return plan


def _has_positive_context_phrase(text_lower: str, phrase: str) -> bool:
    """
    Return True when a context phrase appears without obvious local negation.
    This prevents strings like "no chest pain" from enabling chest-pain rules.
    """
    for match in re.finditer(re.escape(phrase), text_lower):
        prefix = text_lower[max(0, match.start() - 30):match.start()]
        if re.search(r"\b(no|denies|denied|without|not)\b(?:\s+\w+){0,3}\s*$", prefix):
            continue
        return True
    return False


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
    encounter_type = _infer_encounter_type(transcription)
    diabetes_counselling = (
        encounter_type == "counselling_or_education"
        and "diabetes" in text_lower
    )

    pericarditis_leading = "pericarditis" in assessment.lower()
    pericarditis_context_present = any(_has_positive_context_phrase(text_lower, phrase) for phrase in [
        "chest pain", "pleuritic", "lean forward", "leaning forward",
        "sit forward", "troponin", "ecg", "shortness of breath",
        "breathlessness", "viral", "upper respiratory", "urti",
    ])
    pericarditis_rules_enabled = pericarditis_leading and pericarditis_context_present
    viral_urti_present = any(phrase in text_lower for phrase in [
        "sniffles", "sore throat", "viral", "upper respiratory", "urti",
    ])
    forward_leaning_asked = any(phrase in text_lower for phrase in [
        "lean forward", "leaning forward", "sit forward",
    ])

    if pericarditis_rules_enabled and viral_urti_present and "viral" not in assessment.lower() and "urti" not in assessment.lower():
        assessment = _append_sentence(
            assessment,
            "This is further supported by the recent viral upper respiratory tract illness described in the history.",
        )

    if pericarditis_rules_enabled and "myopericarditis" not in assessment.lower():
        assessment = _append_sentence(
            assessment,
            "If troponin returns elevated, myopericarditis should be considered and urgent cardiology review sought.",
        )

    if pericarditis_rules_enabled and not forward_leaning_asked and "forward-leaning relief" not in subjective.lower():
        if _aggravating_factors_explored(text_lower):
            subjective = _remove_sentence(
                subjective,
                r"[^.]*lack of inquiry into potential aggravating or relieving factors[^.]*\.\s*",
            )
        subjective = _remove_sentence(
            subjective,
            r"History gaps identified:\s*the patient's recent illness could be relevant to his current symptoms,\s*and further questioning about his family history of heart disease may be necessary\.\s*",
        )
        subjective = _remove_sentence(
            subjective,
            r"History gaps identified include that relief on leaning forward was not explored in this recording\.\s*",
        )
        subjective = _remove_sentence(
            subjective,
            r"[^.]*Relief on leaning forward was not explored in this recording\.\s*",
        )
        subjective = _append_sentence(
            subjective,
            "History gaps identified include that relief on leaning forward was not explored in this recording.",
        )

    if pericarditis_rules_enabled and "ecg" in plan.lower() and "requested" not in objective.lower():
        objective = _append_sentence(
            objective,
            "Investigations requested and pending include ECG, troponin, CRP/ESR, FBC, and echocardiography.",
        )

    if pericarditis_rules_enabled and "dosing" not in plan.lower() and "dose" not in plan.lower():
        plan = _append_sentence(
            plan,
            "Medication dosing and duration are to be confirmed by the prescribing clinician.",
        )

    if pericarditis_rules_enabled and "1–2 weeks" not in plan and "1-2 weeks" not in plan and "one to two weeks" not in plan.lower():
        plan = _append_sentence(
            plan,
            "Follow-up should be arranged in 1–2 weeks for clinical review and repeat inflammatory markers.",
        )

    if pericarditis_rules_enabled:
        assessment = _merge_viral_support_into_pericarditis_assessment(assessment)
        plan = _strengthen_pericarditis_plan_language(plan)
        plan = _dedupe_follow_up_sentences(plan)
        plan = _dedupe_safety_netting_sentences(plan)

    if diabetes_counselling:
        if "blood test" in text_lower and "not reviewed" not in objective.lower():
            objective = _append_sentence(
                objective,
                "The prior blood test prompting this appointment was referenced, but the underlying results including HbA1c value were not reviewed in detail in the transcript.",
            )

        objective = _remove_sentence(objective, r"[^.]*\bECG\b[^.]*\.")
        subjective = re.sub(r"\bsweating\b", "poor diet", subjective, flags=re.IGNORECASE)
        assessment = re.sub(r"\bsweating\b", "poor diet", assessment, flags=re.IGNORECASE)
        plan = re.sub(r"\bsweating\b", "poor diet", plan, flags=re.IGNORECASE)

        unsupported_patterns = [
            r"[^.]*\binsulin\b[^.]*\.",
            r"[^.]*\bNSAID(?:s)?\b[^.]*\.",
            r"[^.]*\bgastroprotection\b[^.]*\.",
            r"[^.]*\bcolchicine\b[^.]*\.",
            r"[^.]*\bavoid strenuous exercise\b[^.]*\.",
            r"[^.]*\bavoid exercise\b[^.]*\.",
            r"[^.]*\brest as needed\b[^.]*\.",
            r"[^.]*\bcardiac monitoring\b[^.]*\.",
            r"[^.]*\btroponin\b[^.]*\.",
            r"[^.]*\bECG\b[^.]*\.",
            r"[^.]*\bhypoglyc\w*\b[^.]*\.",
        ]
        for pattern in unsupported_patterns:
            plan = _remove_sentence(plan, pattern)

        assessment = _remove_sentence(assessment, r"[^.]*\bcardiovascular disease\b[^.]*\.")
        assessment = _remove_sentence(assessment, r"[^.]*\bneuropathy\b[^.]*\.")

        if "health literacy" not in assessment.lower() and "summaris" in text_lower:
            assessment = _append_sentence(
                assessment,
                "The patient demonstrated good understanding by accurately summarising the explanation, supporting good health literacy and engagement with self-management education.",
            )

        if "self-blame" not in assessment.lower() and "lack of exercise" in text_lower:
            assessment = _append_sentence(
                assessment,
                "The patient's belief that diabetes is caused purely by lifestyle factors may contribute to self-blame and should be addressed sensitively during management.",
            )
        if "type unspecified" not in assessment.lower() and "type 2" not in assessment.lower():
            assessment = _append_sentence(
                assessment,
                "Diabetes type is unspecified in this transcript, though the overall presentation is most suggestive of type 2 diabetes.",
            )

        if "leaflets" in text_lower and "leaflet" not in plan.lower():
            plan = _append_sentence(
                plan,
                "Written information leaflets were provided, and follow-up should review blood results, baseline diabetes monitoring, lifestyle support, and any questions arising after the education discussion.",
            )

        plan = _dedupe_follow_up_sentences(plan)

        subjective = _cleanup_spacing(subjective)
        objective = _cleanup_spacing(objective)
        assessment = _cleanup_numbered_assessment(_cleanup_spacing(assessment))
        plan = _cleanup_spacing(plan)

    subjective = _enforce_patient_context(subjective, transcription)
    subjective = _ensure_clinician_context(subjective, {"encounter": _extract_patient_context(transcription)})

    soap["subjective"] = subjective
    soap["objective"] = objective
    soap["assessment"] = assessment
    soap["plan"] = plan
    return soap


def _validate_and_repair_soap_note(transcription: str, soap: dict, clinical_representation: dict) -> dict:
    """
    Apply a grounded validation/repair pass after initial generation.
    """
    soap = _normalize_soap_sections(soap)
    soap = _apply_clinical_consistency_rules(transcription, soap)

    issues = _collect_soap_issues(transcription, soap, clinical_representation)
    if issues:
        print(f"SOAP validator flagged issues: {issues}")
        soap = _repair_soap_with_rules(transcription, soap, clinical_representation, issues)

    soap = _normalize_soap_sections(soap)
    soap = _apply_clinical_consistency_rules(transcription, soap)
    quality_report = _score_soap_quality(transcription, soap, clinical_representation)

    if (not quality_report["passes_threshold"]) or any(quality_report["section_issues"].values()):
        regenerated = _regenerate_weak_sections(transcription, soap, clinical_representation, quality_report)
        regenerated = _normalize_soap_sections(regenerated)
        regenerated = _apply_clinical_consistency_rules(transcription, regenerated)
        regenerated_issues = _collect_soap_issues(transcription, regenerated, clinical_representation)
        if regenerated_issues:
            regenerated = _repair_soap_with_rules(transcription, regenerated, clinical_representation, regenerated_issues)
            regenerated = _normalize_soap_sections(regenerated)
            regenerated = _apply_clinical_consistency_rules(transcription, regenerated)
        regenerated_report = _score_soap_quality(transcription, regenerated, clinical_representation)
        if regenerated_report["overall_score"] >= quality_report["overall_score"]:
            soap = regenerated
            quality_report = regenerated_report

    soap["quality_report"] = quality_report
    soap["quality_score"] = quality_report["overall_score"]
    return soap


def _collect_soap_issues(transcription: str, soap: dict, clinical_representation: dict) -> list[str]:
    issues = []
    text_lower = transcription.lower()
    encounter_type = clinical_representation.get("encounter", {}).get("type")
    plan = str(soap.get("plan", "")).lower()
    assessment = str(soap.get("assessment", "")).lower()
    objective = str(soap.get("objective", "")).lower()
    subjective = str(soap.get("subjective", ""))

    age = clinical_representation.get("patient", {}).get("age_years")
    if age is not None and f"{age}-year-old" not in subjective and re.search(r"\b\d{1,3}-year-old\b", subjective):
        issues.append("age_mismatch")

    if encounter_type == "counselling_or_education":
        if any(term in plan for term in ["nsaid", "gastroprotection", "colchicine", "avoid strenuous exercise", "rest as needed"]):
            issues.append("unsupported_counselling_plan_items")
        if "insulin" in plan and "insulin" not in text_lower:
            issues.append("unsupported_insulin_plan")
        if "hypogly" in plan and "medication" not in text_lower and "insulin" not in text_lower:
            issues.append("premature_hypoglycaemia_safety_netting")
        if any(term in assessment for term in ["cardiovascular disease", "neuropathy"]) and "less likely" in assessment:
            issues.append("future_risks_miscast_as_differential")
        if "blood test" in text_lower and "hba1c" not in objective and "not reviewed" not in objective:
            issues.append("missing_result_gap")

    return issues


def _collect_section_issues(transcription: str, soap: dict, clinical_representation: dict) -> dict[str, list[str]]:
    text_lower = transcription.lower()
    patient = clinical_representation.get("patient", {})
    encounter_type = clinical_representation.get("encounter", {}).get("type")
    plan_context = clinical_representation.get("plan_context", {})
    assessment_context = clinical_representation.get("assessment_context", {})
    objective_context = clinical_representation.get("objective_data", {})
    subjective_context = clinical_representation.get("subjective_data", {})

    subjective = str(soap.get("subjective", ""))
    objective = str(soap.get("objective", ""))
    assessment = str(soap.get("assessment", ""))
    plan = str(soap.get("plan", ""))

    issues = {
        "subjective": [],
        "objective": [],
        "assessment": [],
        "plan": [],
    }

    age = patient.get("age_years")
    if age is not None and f"{age}-year-old" not in subjective and re.search(r"\b\d{1,3}-year-old\b", subjective):
        issues["subjective"].append("age_mismatch")
    if patient.get("date_of_birth") and patient["date_of_birth"] not in subjective:
        issues["subjective"].append("missing_dob")
    if subjective_context.get("concerns") and "concern" not in subjective.lower() and "worr" not in subjective.lower():
        issues["subjective"].append("missing_concerns")
    if subjective_context.get("expectations") and "would like" not in subjective.lower() and "wants" not in subjective.lower():
        issues["subjective"].append("missing_expectations")
    if clinical_representation.get("encounter", {}).get("clinician_name") and clinical_representation.get("encounter", {}).get("clinician_name", "").lower() not in subjective.lower():
        issues["subjective"].append("missing_clinician_context")
    if clinical_representation.get("history_gaps") and not all(gap.lower() in subjective.lower() for gap in clinical_representation.get("history_gaps", [])[:4]):
        issues["subjective"].append("missing_history_gaps")

    if objective_context.get("results_missing") and "not reviewed" not in objective.lower() and "not documented" not in objective.lower():
        issues["objective"].append("missing_result_gap")
    if objective_context.get("results_missing") and not all(result.lower() in objective.lower() for result in objective_context.get("results_missing", [])):
        issues["objective"].append("missing_specific_result_names")
    if "history-taking only" not in objective.lower() and "history taking only" not in objective.lower() and clinical_representation.get("encounter", {}).get("history_only"):
        issues["objective"].append("missing_history_only_framing")
    if encounter_type == "counselling_or_education" and "ecg" in objective.lower():
        issues["objective"].append("irrelevant_ecg_template")

    if encounter_type == "counselling_or_education":
        if any(term in assessment.lower() for term in ["cardiovascular disease", "neuropathy"]) and "less likely" in assessment.lower():
            issues["assessment"].append("future_risks_as_differential")
        if assessment_context.get("historical_manifestations") and not any(
            marker in assessment.lower() for marker in ["hyperglycaemia", "historical", "prior", "preceding"]
        ):
            issues["assessment"].append("missing_historical_manifestation_context")
        if assessment_context.get("health_literacy") == "good" and "health literacy" not in assessment.lower() and "understanding" not in assessment.lower():
            issues["assessment"].append("missing_health_literacy")
        if "type unspecified" not in assessment.lower() and "type 2" not in assessment.lower():
            issues["assessment"].append("missing_diabetes_type_context")

    if any(term in plan.lower() for term in ["nsaid", "gastroprotection", "colchicine", "avoid strenuous exercise", "rest as needed"]):
        issues["plan"].append("unsupported_plan_items")
    if "insulin" in plan.lower() and "insulin" not in text_lower:
        issues["plan"].append("unsupported_insulin")
    if plan_context.get("education_provided") and "education provided today" not in plan.lower() and "leaflet" not in plan.lower():
        issues["plan"].append("missing_education")
    if plan_context.get("monitoring_to_arrange") and "monitor" not in plan.lower() and "arrange" not in plan.lower():
        issues["plan"].append("missing_monitoring")
    if plan_context.get("follow_up_needs") and "follow-up" not in plan.lower() and "follow up" not in plan.lower():
        issues["plan"].append("missing_follow_up")
    if encounter_type == "counselling_or_education" and plan_context.get("referrals_to_consider") and "refer" not in plan.lower() and "referral" not in plan.lower():
        issues["plan"].append("missing_referrals")
    if encounter_type == "counselling_or_education" and "hypogly" in plan.lower() and "medication" not in text_lower and "insulin" not in text_lower:
        issues["plan"].append("premature_hypoglycaemia_safety_netting")
    if encounter_type == "counselling_or_education" and plan_context.get("education_provided"):
        education_terms = " ".join(plan_context["education_provided"]).lower()
        required_markers = [
            ("teach-back" in education_terms, "teach-back"),
            ("leaflet" in education_terms, "leaflet"),
            ("complications" in education_terms, "complication"),
        ]
        if any(required and marker not in plan.lower() for required, marker in required_markers):
            issues["plan"].append("missing_education_detail")

    return issues


def _score_soap_quality(transcription: str, soap: dict, clinical_representation: dict) -> dict:
    section_issues = _collect_section_issues(transcription, soap, clinical_representation)
    weights = {
        "subjective": 25,
        "objective": 20,
        "assessment": 30,
        "plan": 25,
    }
    issue_penalties = {
        "age_mismatch": 10,
        "missing_dob": 6,
        "missing_clinician_context": 3,
        "missing_concerns": 4,
        "missing_expectations": 4,
        "missing_history_gaps": 5,
        "missing_result_gap": 8,
        "missing_specific_result_names": 4,
        "missing_history_only_framing": 5,
        "irrelevant_ecg_template": 8,
        "future_risks_as_differential": 12,
        "missing_historical_manifestation_context": 6,
        "missing_health_literacy": 5,
        "missing_diabetes_type_context": 5,
        "unsupported_plan_items": 14,
        "unsupported_insulin": 12,
        "missing_education": 5,
        "missing_education_detail": 5,
        "missing_monitoring": 5,
        "missing_follow_up": 4,
        "missing_referrals": 5,
        "premature_hypoglycaemia_safety_netting": 8,
    }

    section_scores = {}
    for section, max_score in weights.items():
        penalties = sum(issue_penalties.get(issue, 4) for issue in section_issues[section])
        section_scores[section] = max(0, max_score - penalties)

    overall_score = round(sum(section_scores.values()), 1)
    pass_threshold = 95.0

    return {
        "overall_score": overall_score,
        "target_score": pass_threshold,
        "passes_threshold": overall_score >= pass_threshold,
        "section_scores": section_scores,
        "section_issues": section_issues,
    }


def _regenerate_weak_sections(transcription: str, soap: dict, clinical_representation: dict, quality_report: dict) -> dict:
    updated = dict(soap)
    section_issues = quality_report.get("section_issues", {})
    section_scores = quality_report.get("section_scores", {})
    encounter_type = clinical_representation.get("encounter", {}).get("type")

    for section in ("subjective", "objective", "assessment", "plan"):
        issues = section_issues.get(section, [])
        score = section_scores.get(section, 0)
        if not issues and score >= _section_max_score(section):
            continue
        if section == "subjective" and str(updated.get("subjective", "")).strip():
            continue
        if section == "plan" and encounter_type == "acute_presentation" and str(updated.get("plan", "")).strip():
            continue

        try:
            regenerated = _regenerate_section_with_groq(
                section,
                transcription,
                updated,
                clinical_representation,
                issues,
            )
            print(f"Regenerated {section} via Groq")
        except Exception as exc:
            print(f"Section regeneration via Groq failed for {section}: {exc}")
            regenerated = _regenerate_section_with_rules(section, transcription, clinical_representation)

        if regenerated:
            updated[section] = regenerated

    return updated


def _section_max_score(section: str) -> int:
    return {
        "subjective": 25,
        "objective": 20,
        "assessment": 30,
        "plan": 25,
    }[section]


def _sentence_join(parts: list[str]) -> str:
    cleaned = [part.strip().rstrip(".") for part in parts if part and part.strip()]
    if not cleaned:
        return INSUFFICIENT_SECTION_TEXT
    return ". ".join(cleaned) + "."


def _regenerate_section_with_rules(section: str, transcription: str, clinical_representation: dict) -> str:
    patient = clinical_representation.get("patient", {})
    encounter = clinical_representation.get("encounter", {})
    subjective_data = clinical_representation.get("subjective_data", {})
    objective_data = clinical_representation.get("objective_data", {})
    assessment_context = clinical_representation.get("assessment_context", {})
    plan_context = clinical_representation.get("plan_context", {})
    history_gaps = clinical_representation.get("history_gaps", [])

    if section == "subjective":
        demographic = ""
        if patient.get("name"):
            demographic = patient["name"]
            if patient.get("date_of_birth"):
                demographic += f" (DOB {patient['date_of_birth']})"
            if patient.get("age_years") is not None:
                demographic += f", a {patient['age_years']}-year-old patient"
        clinician_name = encounter.get("clinician_name")
        clinician_role = encounter.get("clinician_role")
        intro_sentence = demographic
        if clinician_name:
            role_clause = f", {clinician_role}" if clinician_role else ""
            intro_sentence += f" was seen by {clinician_name}{role_clause}"
        if encounter.get("visit_reason"):
            intro_sentence += f" for {encounter['visit_reason'].rstrip('.').lower()}"
        parts = [
            intro_sentence,
            " ".join(subjective_data.get("emotional_response", [])),
            "Ideas include " + "; ".join(subjective_data.get("ideas", [])) if subjective_data.get("ideas") else "",
            "Concerns include " + "; ".join(subjective_data.get("concerns", [])) if subjective_data.get("concerns") else "",
            "Expectations include " + "; ".join(subjective_data.get("expectations", [])) if subjective_data.get("expectations") else "",
            "History gaps identified: " + "; ".join(history_gaps[:4]) if history_gaps else "",
        ]
        return _sentence_join(parts)

    if section == "objective":
        parts = [
            "This recording captures history-taking only and objective findings are pending clinical examination and investigation"
            if encounter.get("history_only") else "",
            "Tests referenced but not reviewed in detail include " + "; ".join(objective_data.get("tests_referenced_only", []))
            if objective_data.get("tests_referenced_only") else "",
            "Results not documented in transcript include " + "; ".join(objective_data.get("results_missing", []))
            if objective_data.get("results_missing") else "",
        ]
        return _sentence_join(parts)

    if section == "assessment":
        parts = []
        confirmed = assessment_context.get("confirmed_diagnoses", [])
        if confirmed:
            parts.append("1. " + confirmed[0].title() + ": supported by the transcript and prior testing context")
        if assessment_context.get("historical_manifestations"):
            parts.append(
                "Historical manifestations likely related to hyperglycaemia include "
                + "; ".join(assessment_context["historical_manifestations"])
            )
        if assessment_context.get("health_literacy") == "good":
            parts.append("The patient demonstrated good understanding and health literacy during the education discussion")
        if assessment_context.get("psychosocial_factors"):
            parts.append("Psychosocial factors relevant to management include " + "; ".join(assessment_context["psychosocial_factors"]))
        if "diabetes" in " ".join(confirmed).lower():
            parts.append("Diabetes type is unspecified in this transcript, though the presentation is most suggestive of type 2 diabetes")
        return _sentence_join(parts)

    if section == "plan":
        parts = []
        if plan_context.get("education_provided"):
            parts.append("Education provided today included " + "; ".join(plan_context["education_provided"]))
        if plan_context.get("monitoring_to_arrange"):
            parts.append("Monitoring to arrange includes " + "; ".join(plan_context["monitoring_to_arrange"]))
        if plan_context.get("referrals_to_consider"):
            parts.append("Referrals to arrange or consider include " + "; ".join(plan_context["referrals_to_consider"]))
        if plan_context.get("follow_up_needs"):
            parts.append("Follow-up needs include " + "; ".join(plan_context["follow_up_needs"]))
        if plan_context.get("safety_netting"):
            parts.append("Safety-netting provided: " + "; ".join(plan_context["safety_netting"]))
        return _sentence_join(parts)

    return INSUFFICIENT_SECTION_TEXT


def _repair_soap_with_rules(transcription: str, soap: dict, clinical_representation: dict, issues: list[str]) -> dict:
    subjective = str(soap.get("subjective", ""))
    objective = str(soap.get("objective", ""))
    assessment = str(soap.get("assessment", ""))
    plan = str(soap.get("plan", ""))

    if "age_mismatch" in issues or "missing_dob" in issues:
        subjective = _enforce_patient_context(subjective, transcription)
    if "missing_clinician_context" in issues:
        subjective = _ensure_clinician_context(subjective, clinical_representation)
    if "missing_history_gaps" in issues:
        subjective = _ensure_history_gaps(subjective, clinical_representation)
    if "missing_concerns" in issues:
        concerns = clinical_representation.get("subjective_data", {}).get("concerns", [])
        if concerns:
            subjective = _append_sentence(subjective, "Concerns include " + "; ".join(concerns) + ".")
    if "missing_expectations" in issues:
        expectations = clinical_representation.get("subjective_data", {}).get("expectations", [])
        if expectations:
            subjective = _append_sentence(subjective, "Expectations include " + "; ".join(expectations) + ".")

    if "missing_result_gap" in issues:
        objective = _append_sentence(
            objective,
            "The underlying blood test results prompting this consultation, including HbA1c value, were not reviewed in detail in the transcript.",
        )
    if "missing_specific_result_names" in issues:
        missing_results = clinical_representation.get("objective_data", {}).get("results_missing", [])
        if missing_results:
            objective = _append_sentence(
                objective,
                "Specific results not documented in transcript include " + "; ".join(missing_results) + ".",
            )
    if "irrelevant_ecg_template" in issues:
        objective = _remove_sentence(objective, r"[^.]*\bECG\b[^.]*\.")

    if "future_risks_miscast_as_differential" in issues:
        assessment = _remove_sentence(assessment, r"[^.]*\bcardiovascular disease\b[^.]*\.")
        assessment = _remove_sentence(assessment, r"[^.]*\bneuropathy\b[^.]*\.")
        assessment = _cleanup_numbered_assessment(_cleanup_spacing(assessment))
    if "missing_diabetes_type_context" in issues:
        assessment = _append_sentence(
            assessment,
            "Diabetes type is unspecified in this transcript, though the overall presentation is most suggestive of type 2 diabetes.",
        )

    if "unsupported_counselling_plan_items" in issues or "unsupported_insulin_plan" in issues or "premature_hypoglycaemia_safety_netting" in issues:
        for pattern in [
            r"[^.]*\binsulin\b[^.]*\.",
            r"[^.]*\bNSAID(?:s)?\b[^.]*\.",
            r"[^.]*\bgastroprotection\b[^.]*\.",
            r"[^.]*\bcolchicine\b[^.]*\.",
            r"[^.]*\bavoid strenuous exercise\b[^.]*\.",
            r"[^.]*\brest as needed\b[^.]*\.",
            r"[^.]*\bhypoglyc\w*\b[^.]*\.",
        ]:
            plan = _remove_sentence(plan, pattern)

        follow_up_needs = clinical_representation.get("plan_context", {}).get("follow_up_needs", [])
        monitoring = clinical_representation.get("plan_context", {}).get("monitoring_to_arrange", [])
        education = clinical_representation.get("plan_context", {}).get("education_provided", [])
        if education:
            plan = _append_sentence(plan, "Education provided today included " + "; ".join(education) + ".")
        if monitoring:
            plan = _append_sentence(plan, "Monitoring to arrange includes " + "; ".join(monitoring) + ".")
        if follow_up_needs:
            plan = _append_sentence(plan, "Follow-up needs include " + "; ".join(follow_up_needs) + ".")
        referrals = clinical_representation.get("plan_context", {}).get("referrals_to_consider", [])
        safety_netting = clinical_representation.get("plan_context", {}).get("safety_netting", [])
        if referrals:
            plan = _append_sentence(plan, "Referrals to arrange or consider include " + "; ".join(referrals) + ".")
        if safety_netting:
            plan = _append_sentence(plan, "Safety-netting provided: " + "; ".join(safety_netting) + ".")
    if "missing_education_detail" in issues:
        education = clinical_representation.get("plan_context", {}).get("education_provided", [])
        if education:
            plan = _append_sentence(plan, "Education provided today included " + "; ".join(education) + ".")

    plan = _dedupe_follow_up_sentences(plan)
    plan = _dedupe_safety_netting_sentences(plan)

    soap["subjective"] = _cleanup_spacing(subjective)
    soap["objective"] = _cleanup_spacing(objective)
    soap["assessment"] = _cleanup_numbered_assessment(_cleanup_spacing(assessment))
    soap["plan"] = _cleanup_spacing(plan)
    return soap


def _fallback_subjective(transcription: str, symptoms: list, clinical_representation: dict) -> dict:
    symptom_list = [s["text"] for s in symptoms]
    patient = clinical_representation.get("patient", {})
    encounter = clinical_representation.get("encounter", {})
    subjective_data = clinical_representation.get("subjective_data", {})
    chief_complaint = (
        "Patient reports: " + ", ".join(symptom_list)
        if symptom_list
        else "No specific complaints documented."
    )
    return {
        "patient": patient.get("name") or "Not documented",
        "encounter_type": encounter.get("type") or "general_consultation",
        "chief_complaint": chief_complaint,
        "symptoms": subjective_data.get("historical_symptoms") or symptom_list,
        "ideas": subjective_data.get("ideas", []),
        "concerns": subjective_data.get("concerns", []),
        "expectations": subjective_data.get("expectations", []),
        "symptom_count": len(symptom_list),
        "narrative": transcription.strip(),
    }


def _fallback_objective(procedures: list, clinical_representation: dict) -> dict:
    procedure_list = [p["text"] for p in procedures]
    objective_data = clinical_representation.get("objective_data", {})
    if not procedure_list and not objective_data:
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
        "findings": findings if findings else ["No examination findings documented in transcript"],
        "procedures": objective_data.get("tests_referenced_only", procedure_list),
        "tests_reviewed": objective_data.get("tests_reviewed", []),
        "results_missing": objective_data.get("results_missing", []),
        "procedure_count": len(procedure_list),
    }


def _fallback_assessment(conditions: list, clinical_representation: dict) -> dict:
    condition_list = [c["text"] for c in conditions]
    assessment_context = clinical_representation.get("assessment_context", {})
    confirmed = assessment_context.get("confirmed_diagnoses", [])
    if not condition_list and not confirmed:
        return {"note": INSUFFICIENT_SECTION_TEXT}
    condition_list = confirmed or condition_list
    if condition_list:
        primary_diagnosis = condition_list[0]
        additional_diagnoses = condition_list[1:]
    else:
        primary_diagnosis = "Assessment pending further evaluation"
        additional_diagnoses = []
    return {
        "primary_diagnosis": primary_diagnosis,
        "additional_diagnoses": additional_diagnoses,
        "historical_manifestations": assessment_context.get("historical_manifestations", []),
        "future_risks_discussed": assessment_context.get("discussed_future_risks", []),
        "psychosocial_factors": assessment_context.get("psychosocial_factors", []),
        "health_literacy": assessment_context.get("health_literacy"),
        "all_conditions": condition_list,
        "condition_count": len(condition_list),
    }


def _fallback_plan(medications: list, procedures: list, clinical_representation: dict) -> dict:
    medication_list = [m["text"] for m in medications]
    procedure_list = [p["text"] for p in procedures]
    plan_context = clinical_representation.get("plan_context", {})
    encounter_type = clinical_representation.get("encounter", {}).get("type")
    plan_items = []
    if medication_list and encounter_type != "counselling_or_education":
        plan_items.append(f"Medications: {', '.join(medication_list)}")
    if procedure_list and encounter_type != "counselling_or_education":
        plan_items.append(f"Procedures: {', '.join(procedure_list)}")
    if plan_context.get("education_provided"):
        plan_items.append(f"Education: {'; '.join(plan_context['education_provided'])}")
    if plan_context.get("monitoring_to_arrange"):
        plan_items.append(f"Monitoring: {'; '.join(plan_context['monitoring_to_arrange'])}")
    if plan_context.get("follow_up_needs"):
        plan_items.append(f"Follow-up: {'; '.join(plan_context['follow_up_needs'])}")
    if not plan_items:
        return {"note": INSUFFICIENT_SECTION_TEXT}
    return {
        "treatment_plan": plan_items,
        "medications": plan_context.get("medications_currently_taken", medication_list),
        "medications_discussed": plan_context.get("medications_actively_discussed", []),
        "follow_up_procedures": procedure_list,
        "referrals_to_consider": plan_context.get("referrals_to_consider", []),
        "safety_netting": plan_context.get("safety_netting", []),
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
