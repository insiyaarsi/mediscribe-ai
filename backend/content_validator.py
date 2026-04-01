"""
Content Validator for MediScribe AI
Validates whether transcribed audio contains medical content before processing.
"""
import re

from medical_categories import (
    SYMPTOMS, MEDICATIONS, CONDITIONS, PROCEDURES,
    ANATOMICAL_TERMS, CLINICAL_MODIFIERS, CLINICAL_TERMS
)

# Clinical context markers that indicate medical content.
# Covers both documentation-style speech (doctor monologue) and
# conversational history-taking speech (two-speaker consultation).
CLINICAL_MARKERS = [
    # Patient presentation — documentation style
    "patient", "presenting", "chief complaint", "history of present illness",
    "hpi", "complains of", "reports", "denies",

    # Patient presentation — conversational history-taking style
    "what's brought you in", "what brought you in", "brought you in today",
    "how long have you", "when did this start", "when did it start",
    "can you describe", "tell me more about", "tell me a bit more",
    "does it go anywhere", "does the pain", "where is the pain",
    "what makes it worse", "what makes it better", "anything that makes",
    "on a scale of", "scale of 1 to 10", "rate your pain",
    "any other symptoms", "other symptoms", "at the same time",
    "medical history", "past medical history", "family history",
    "any medications", "taking any", "allergic to",
    "have you had this before", "had this before",
    "check your name", "date of birth",

    # Physical examination
    "physical exam", "examination", "vital signs", "vitals", "blood pressure",
    "heart rate", "temperature", "respiratory rate", "pulse", "bp",

    # Clinical assessment
    "diagnosis", "assessment", "impression", "differential", "plan",
    "treatment", "follow up", "prognosis",

    # Temporal medical phrases
    "year old", "years old", "month old", "day old", "week old",
    "male", "female", "admitted", "discharged", "hospitalized",

    # Common medical abbreviations
    "mg", "ml", "mcg", "kg", "lbs", "mmhg", "bpm", "°f", "°c"
]

# Consultation-style markers common in GP/primary-care conversations.
# These help recognise genuine clinical counselling/history-taking audio
# where the transcript is long and conversational, so raw medical density
# is lower than in dictated notes.
CONSULTATION_MARKERS = [
    "how can i help you today",
    "what symptoms did you come in with",
    "what kind of things were you experiencing",
    "how are you feeling about",
    "does that make sense",
    "summarise what we've just gone through",
    "give us a call",
    "book in to speak to one of the gps again",
    "book in to speak to one of the gps",
    "leaflets",
    "gp surgery",
    "junior doctor",
]


def _normalize_text(text: str) -> str:
    """
    Lowercase and strip punctuation so matching is resilient to Whisper noise.
    """
    lowered = text.lower().replace("’", "'")
    normalized = re.sub(r"[^a-z0-9\s]", " ", lowered)
    return re.sub(r"\s+", " ", normalized).strip()


def _tokenize(text: str) -> list[str]:
    return _normalize_text(text).split()


def _build_medical_term_sets() -> tuple[set[str], set[str], int]:
    """
    Build normalized single- and multi-word medical term dictionaries.
    """
    all_medical_terms: set[str] = set()
    for term_list in [SYMPTOMS, MEDICATIONS, CONDITIONS, PROCEDURES,
                      ANATOMICAL_TERMS, CLINICAL_MODIFIERS, CLINICAL_TERMS]:
        all_medical_terms.update(_normalize_text(term) for term in term_list if term)

    single_word_terms = {term for term in all_medical_terms if " " not in term}
    multi_word_terms = {term for term in all_medical_terms if " " in term}
    max_term_length = max((len(term.split()) for term in multi_word_terms), default=1)
    return single_word_terms, multi_word_terms, max_term_length


def calculate_medical_term_density(text: str) -> float:
    """
    Calculate the percentage of words in text that are medical terms.
    Applies a length-based adjustment: longer transcripts (more total words)
    are expected to have lower density due to conversational dilution, so the
    raw density is scaled up slightly to compensate.
    """
    if not text or len(text.strip()) == 0:
        return 0.0

    normalized_text = _normalize_text(text)
    words = normalized_text.split()

    if len(words) == 0:
        return 0.0

    single_word_terms, multi_word_terms, max_term_length = _build_medical_term_sets()

    # Count medical terms using greedy n-gram matching so phrases like
    # "chest pain" or "shortness of breath" survive noisy punctuation.
    medical_word_count = 0
    idx = 0
    while idx < len(words):
        matched = False
        max_window = min(max_term_length, len(words) - idx)
        for window in range(max_window, 1, -1):
            candidate = " ".join(words[idx: idx + window])
            if candidate in multi_word_terms:
                medical_word_count += window
                idx += window
                matched = True
                break

        if matched:
            continue

        if words[idx] in single_word_terms:
            medical_word_count += 1
        idx += 1

    raw_density = medical_word_count / len(words)

    # Length-based scaling: dialogues over 200 words are boosted slightly
    # because patient conversational speech dilutes clinical term density.
    # Cap the boost at 1.5x to prevent non-medical content from passing.
    if len(words) > 200:
        scale_factor = min(1.0 + (len(words) - 200) / 1000, 1.5)
        return min(raw_density * scale_factor, 1.0)

    return raw_density


def check_clinical_markers(text: str) -> dict:
    """
    Check for clinical context markers that indicate medical content.
    """
    normalized_text = f" {_normalize_text(text)} "
    found_markers = []

    for marker in CLINICAL_MARKERS:
        normalized_marker = _normalize_text(marker)
        if normalized_marker and f" {normalized_marker} " in normalized_text:
            found_markers.append(marker)

    return {
        "marker_count": len(found_markers),
        "found_markers": found_markers
    }


def check_consultation_markers(text: str) -> dict:
    """
    Check for two-speaker consultation/counselling markers.
    """
    normalized_text = f" {_normalize_text(text)} "
    found_markers = []

    for marker in CONSULTATION_MARKERS:
        normalized_marker = _normalize_text(marker)
        if normalized_marker and f" {normalized_marker} " in normalized_text:
            found_markers.append(marker)

    return {
        "marker_count": len(found_markers),
        "found_markers": found_markers
    }


def summarize_medical_term_mentions(text: str) -> dict:
    """
    Count repeated medical-term mentions across the transcript.
    Useful for long counselling encounters where a few core diagnoses
    are discussed repeatedly.
    """
    normalized_text = _normalize_text(text)
    words = normalized_text.split()
    if len(words) == 0:
        return {
            "word_count": 0,
            "total_mentions": 0,
            "distinct_terms": 0,
            "repeated_terms": 0,
            "top_terms": [],
        }

    single_word_terms, multi_word_terms, max_term_length = _build_medical_term_sets()
    term_counts: dict[str, int] = {}

    idx = 0
    while idx < len(words):
        matched = False
        max_window = min(max_term_length, len(words) - idx)
        for window in range(max_window, 1, -1):
            candidate = " ".join(words[idx: idx + window])
            if candidate in multi_word_terms:
                term_counts[candidate] = term_counts.get(candidate, 0) + 1
                idx += window
                matched = True
                break

        if matched:
            continue

        current = words[idx]
        if current in single_word_terms:
            term_counts[current] = term_counts.get(current, 0) + 1
        idx += 1

    repeated_terms = sum(1 for count in term_counts.values() if count >= 2)
    top_terms = sorted(term_counts.items(), key=lambda item: (-item[1], item[0]))[:5]

    return {
        "word_count": len(words),
        "total_mentions": sum(term_counts.values()),
        "distinct_terms": len(term_counts),
        "repeated_terms": repeated_terms,
        "top_terms": top_terms,
    }


def validate_medical_content(transcription: str,
                             min_density: float = 0.08,
                             min_markers: int = 2,
                             min_word_count: int = 50) -> dict:
    """
    Validate whether transcription contains medical content.

    Args:
        transcription: The transcribed text to validate
        min_density:   Minimum medical term density required (default 8%)
                       Lowered from 10% to account for conversational dialogue.
        min_markers:   Minimum number of clinical markers required (default 2)

    Returns:
        Dict with validation results
    """
    if not transcription or len(transcription.strip()) == 0:
        return {
            "is_valid": False,
            "confidence_score": 0.0,
            "reason": "Empty transcription provided",
            "details": {
                "medical_term_density": 0.0,
                "clinical_markers_found": 0,
                "consultation_markers_found": 0,
                "found_markers": [],
                "found_consultation_markers": [],
                "repeated_medical_terms": 0,
                "top_medical_terms": [],
            }
        }

    word_count = len(_tokenize(transcription))

    # Calculate metrics
    density = calculate_medical_term_density(transcription)
    marker_check = check_clinical_markers(transcription)
    marker_count = marker_check["marker_count"]
    consultation_check = check_consultation_markers(transcription)
    consultation_marker_count = consultation_check["marker_count"]
    medical_mentions = summarize_medical_term_mentions(transcription)

    # Short recordings do not provide enough text for the density/marker
    # thresholds to be meaningful. Treat them as a distinct failure mode only
    # when there is at least some clinical signal; otherwise keep the normal
    # non-medical rejection path for clearly unrelated audio.
    if word_count < min_word_count:
        has_medical_signal = (
            density >= (min_density * 0.75)
            or marker_count >= 1
            or consultation_marker_count >= 1
            or medical_mentions["repeated_terms"] >= 1
        )
        return {
            "is_valid": False,
            "confidence_score": 0.0,
            "reason": (
                "Recording is too short to process. Please upload a longer clinical audio clip."
                if has_medical_signal
                else "Non-medical content detected. Please upload clinical audio only."
            ),
            "details": {
                "word_count": word_count,
                "minimum_word_count": min_word_count,
                "medical_term_density": round(density, 3),
                "clinical_markers_found": marker_count,
                "consultation_markers_found": consultation_marker_count,
                "found_markers": marker_check["found_markers"][:5],
                "found_consultation_markers": consultation_check["found_markers"][:5],
                "repeated_medical_terms": medical_mentions["repeated_terms"],
                "top_medical_terms": medical_mentions["top_terms"],
            }
        }

    # Confidence score: 70% weight on density, 30% weight on markers
    density_score = min(density / min_density, 1.0)
    marker_score = min(marker_count / min_markers, 1.0)
    confidence_score = (0.7 * density_score) + (0.3 * marker_score)

    # Conversational clinical audio can have slightly lower term density than
    # classic dictated notes, especially after noisy transcription. Accept it
    # when both signals are still strong overall, but keep the default path
    # strict so entertainment/interview audio is still rejected.
    is_standard_pass = (density >= min_density) and (marker_count >= min_markers)
    is_marker_heavy_pass = (marker_count >= max(min_markers + 2, 4)) and (density >= min_density * 0.6)
    is_density_heavy_pass = (density >= min_density * 1.25) and (marker_count >= 1)
    is_long_consult_pass = (
        medical_mentions["word_count"] >= 250
        and density >= min_density * 0.5
        and marker_count >= min_markers
        and consultation_marker_count >= 2
        and (
            medical_mentions["repeated_terms"] >= 2
            or medical_mentions["distinct_terms"] >= 8
        )
    )
    is_valid = (
        is_standard_pass
        or is_marker_heavy_pass
        or is_density_heavy_pass
        or is_long_consult_pass
    )

    # Reason message
    if is_valid:
        reason = f"Medical content detected (confidence: {confidence_score:.1%})"
    else:
        if density < min_density and marker_count < min_markers:
            reason = "Non-medical content detected. Please upload clinical audio only."
        elif density < min_density:
            reason = f"Insufficient medical terminology (found: {density:.1%}, required: {min_density:.1%})"
        else:
            reason = f"Missing clinical context markers (found: {marker_count}, required: {min_markers})"

    return {
        "is_valid": is_valid,
        "confidence_score": round(confidence_score, 3),
        "reason": reason,
        "details": {
            "word_count": word_count,
            "minimum_word_count": min_word_count,
            "medical_term_density": round(density, 3),
            "clinical_markers_found": marker_count,
            "consultation_markers_found": consultation_marker_count,
            "found_markers": marker_check["found_markers"][:5],
            "found_consultation_markers": consultation_check["found_markers"][:5],
            "repeated_medical_terms": medical_mentions["repeated_terms"],
            "top_medical_terms": medical_mentions["top_terms"],
        }
    }


# Testing function
if __name__ == "__main__":
    non_medical = """Ok, let's talk about heated rivalry. This show is pure tension from the very first moment.
    It's not just about hockey, it's about ego, competition, and two people who absolutely refuse to lose."""

    result1 = validate_medical_content(non_medical)
    print("Non-Medical Content Test:")
    print(f"Valid: {result1['is_valid']}")
    print(f"Confidence: {result1['confidence_score']}")
    print(f"Reason: {result1['reason']}")
    print(f"Details: {result1['details']}")
    print("\n" + "="*60 + "\n")

    medical = """Patient is a 45 year old male presenting with chest pain and shortness of breath.
    Vital signs show blood pressure 140/90, heart rate 88 bpm. Physical examination reveals clear lung sounds."""

    result2 = validate_medical_content(medical)
    print("Medical Content Test:")
    print(f"Valid: {result2['is_valid']}")
    print(f"Confidence: {result2['confidence_score']}")
    print(f"Reason: {result2['reason']}")
    print(f"Details: {result2['details']}")
