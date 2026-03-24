import spacy
from typing import Dict, List
from medical_categories import (
    categorize_entities, categorize_entity,
    SYMPTOMS, MEDICATIONS, CONDITIONS, PROCEDURES,
    ANATOMICAL_TERMS, CLINICAL_MODIFIERS, CLINICAL_TERMS
)

# Upgraded from en_core_sci_sm to en_ner_bc5cdr_md.
# en_ner_bc5cdr_md returns CHEMICAL and DISEASE labels only.
# A second dictionary scan pass runs after the NER pass to catch
# SYMPTOM, PROCEDURE, and TEST entities the model never sees.
print("Loading scispacy medical model...")
nlp = spacy.load("en_ner_bc5cdr_md")
print("Medical model loaded successfully!")


# ── Dictionary scan sets ──────────────────────────────────────────────────────
# These are the term sets used by the second-pass dictionary scanner.
# PROCEDURES is split into TEST_TERMS (lab/diagnostic) and PROCEDURE_TERMS
# so the frontend can distinguish between them. We also scan CONDITIONS and
# MEDICATIONS so entity counts remain stable when the NER model misses them.

TEST_TERMS = {
    "blood test", "blood work", "lab work", "labs",
    "complete blood count", "CBC",
    "basic metabolic panel", "BMP",
    "comprehensive metabolic panel", "CMP",
    "lipid panel", "cholesterol test",
    "hemoglobin a1c", "HbA1c", "A1C",
    "thyroid function test", "TSH",
    "liver function test", "LFT",
    "kidney function test", "renal panel",
    "urinalysis", "urine test",
    "glucose test", "blood glucose", "fasting glucose",
    "creatinine", "BUN", "electrolytes",
    "BNP", "troponin", "INR", "PT", "PTT",
    "d-dimer", "CRP", "ESR",
    "ECG", "EKG", "electrocardiogram",
    "echocardiogram", "echo", "echocardiography",
    "stress test", "cardiac stress test", "exercise stress test",
    "holter monitor", "event monitor",
    "x-ray", "chest x-ray", "abdominal x-ray",
    "CT scan", "CAT scan", "computed tomography",
    "MRI", "magnetic resonance imaging",
    "ultrasound", "mammogram", "bone scan", "PET scan",
    "angiogram",
    "spirometry", "pulmonary function test", "PFT",
    "PHQ-9", "GAD-7", "mental status exam",
}

PROCEDURE_TERMS = {
    t for t in PROCEDURES if t not in TEST_TERMS
}


def is_valid_medical_term(text):
    """Check if text is a valid medical term in any dictionary (partial match)."""
    text_lower = text.lower()
    all_terms = (
        SYMPTOMS | MEDICATIONS | CONDITIONS | PROCEDURES
        | ANATOMICAL_TERMS | CLINICAL_MODIFIERS | CLINICAL_TERMS
    )
    if text_lower in all_terms:
        return True
    for term in all_terms:
        if text_lower == term or text_lower in term or term in text_lower:
            return True
    return False


def is_exact_medical_term(text):
    """Check if text is an exact match in any medical dictionary."""
    text_lower = text.lower().strip()
    all_terms = (
        SYMPTOMS | MEDICATIONS | CONDITIONS | PROCEDURES
        | ANATOMICAL_TERMS | CLINICAL_MODIFIERS | CLINICAL_TERMS
    )
    return text_lower in all_terms


def merge_adjacent_entities_dynamic(entities, original_text):
    """
    Dynamically merge adjacent NER entities if they form a valid compound
    medical term in the dictionaries.

    Example: "shortness" + "breath" -> "shortness of breath"
    Only merges when the combined text is an exact dictionary match.
    """
    if len(entities) < 2:
        return entities

    merged = []
    skip_next = False

    for i in range(len(entities)):
        if skip_next:
            skip_next = False
            continue

        current = entities[i]

        if i + 1 < len(entities):
            next_entity = entities[i + 1]
            gap = next_entity['start'] - current['end']

            if gap <= 5:
                merged_text = original_text[current['start']:next_entity['end']]

                if '.' in merged_text or '!' in merged_text or '?' in merged_text:
                    merged.append(current)
                    continue

                if is_exact_medical_term(merged_text):
                    merged_category = categorize_entity(merged_text)
                    if merged_category in [
                        'symptom', 'medication', 'condition',
                        'procedure', 'anatomical', 'modifier'
                    ]:
                        merged_entity = {
                            'text': merged_text,
                            'label': current['label'],
                            'start': current['start'],
                            'end': next_entity['end']
                        }
                        merged.append(merged_entity)
                        skip_next = True
                        print(
                            f"  Merged: '{current['text']}' + "
                            f"'{next_entity['text']}' -> '{merged_text}' [{merged_category}]"
                        )
                        continue

        merged.append(current)

    return merged


def dictionary_scan(text, existing_entities):
    """
    Second-pass dictionary scan over the raw transcription text.

    The NER model (en_ner_bc5cdr_md) only returns CHEMICAL and DISEASE labels
    with variable recall. This function scans the text directly against the
    SYMPTOMS, CONDITIONS, MEDICATIONS, TEST_TERMS, and PROCEDURE_TERMS
    dictionaries and returns any matches as synthetic entities.

    Entities that overlap with an existing NER entity are skipped to avoid
    double-counting (e.g. 'chest pain' already tagged as DISEASE is not
    re-added as SYMPTOM).

    Args:
        text: The full transcription text (lowercase comparison performed internally)
        existing_entities: List of entity dicts already found by the NER model

    Returns:
        List of new entity dicts to append to the existing list
    """
    text_lower = text.lower()

    # Build a set of character ranges already covered by NER entities
    covered_ranges = set()
    for ent in existing_entities:
        for i in range(ent['start'], ent['end']):
            covered_ranges.add(i)

    new_entities = []

    def scan_dict(term_set, label):
        for term in term_set:
            term_lower = term.lower()
            start = 0
            while True:
                idx = text_lower.find(term_lower, start)
                if idx == -1:
                    break
                end = idx + len(term_lower)

                # Ensure we matched a whole word / phrase boundary
                before_ok = (idx == 0 or not text[idx - 1].isalnum())
                after_ok  = (end == len(text) or not text[end].isalnum())

                if before_ok and after_ok:
                    # Check for overlap with existing NER entities
                    overlap = any(i in covered_ranges for i in range(idx, end))
                    if not overlap:
                        new_entities.append({
                            'text':  text[idx:end],
                            'label': label,
                            'start': idx,
                            'end':   end,
                        })
                        # Mark these positions as covered so we don't double-add
                        for i in range(idx, end):
                            covered_ranges.add(i)

                start = idx + 1

    scan_dict(SYMPTOMS,        'SYMPTOM')
    scan_dict(CONDITIONS,      'CONDITION')
    scan_dict(MEDICATIONS,     'MEDICATION')
    scan_dict(TEST_TERMS,      'TEST')
    scan_dict(PROCEDURE_TERMS, 'PROCEDURE')

    print(f"  Dictionary scan found {len(new_entities)} additional entities "
          f"(SYMPTOM/CONDITION/MEDICATION/TEST/PROCEDURE)")

    return new_entities


def extract_medical_entities(text):
    """
    Extract and categorize medical entities from text using scispacy + dictionary scan.

    Pass 1 — NER model (en_ner_bc5cdr_md):
        High-confidence detection of CHEMICAL (medications) and DISEASE (conditions).

    Pass 2 — Dictionary scan:
        Catches SYMPTOM, CONDITION, MEDICATION, TEST, and PROCEDURE terms the
        NER model may miss. Results are deduplicated against Pass 1 output.

    The combined entity list is returned with the NER/synthetic label in the
    'label' field. The frontend getEntityCategory() maps:
        CHEMICAL   -> MEDICATION
        DISEASE    -> CONDITION
        MEDICATION -> MEDICATION
        CONDITION  -> CONDITION
        SYMPTOM   -> SYMPTOM
        TEST      -> TEST
        PROCEDURE -> PROCEDURE

    Args:
        text (str): The transcribed medical text

    Returns:
        dict: Extracted entities with categories
    """
    print("\n" + "=" * 50)
    print("MEDICAL ENTITY EXTRACTION")
    print("=" * 50)

    try:
        # ── Pass 1: NER model ─────────────────────────────────────────────────
        doc = nlp(text)

        entities = []
        for ent in doc.ents:
            entities.append({
                "text":  ent.text,
                "label": ent.label_,
                "start": ent.start_char,
                "end":   ent.end_char,
            })

        print(f"Pass 1 (NER): {len(entities)} entities (CHEMICAL/DISEASE)")

        if len(entities) > 1:
            print("Checking for compound medical terms (dynamic merge)...")
            entities = merge_adjacent_entities_dynamic(entities, text)
            print(f"After merge: {len(entities)} entities")

        # ── Pass 2: Dictionary scan ───────────────────────────────────────────
        print("\nPass 2 (dictionary scan):")
        additional = dictionary_scan(text, entities)
        entities = entities + additional

        print(f"Total after both passes: {len(entities)} entities")

        # ── Categorize all entities ───────────────────────────────────────────
        categorization_result = categorize_entities(entities)

        categorized = categorization_result.get("categorized", {})
        counts      = categorization_result.get("counts", {})

        category_counts = {
            "symptoms":       counts.get("symptoms", 0),
            "medications":    counts.get("medications", 0),
            "conditions":     counts.get("conditions", 0),
            "procedures":     counts.get("procedures", 0),
            "anatomical":     counts.get("anatomical", 0),
            "modifiers":      counts.get("modifiers", 0),
            "clinical_terms": counts.get("clinical_terms", 0),
            "unknown":        counts.get("unknown", 0),
        }

        print("\nEntity breakdown:")
        for category, count in category_counts.items():
            if count > 0:
                print(f"  {category}: {count}")

        print(f"\nTotal entities: {len(entities)}")

        return {
            "success":        True,
            "entities":       entities,
            "categorized":    categorized,
            "category_counts": category_counts,
            "total_entities": len(entities),
        }

    except Exception as e:
        print(f"ERROR in entity extraction: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success":        False,
            "error":          str(e),
            "entities":       [],
            "categorized":    {},
            "category_counts": {},
            "total_entities": 0,
        }


if __name__ == "__main__":
    test_text = (
        "Patient is a 45-year-old male presenting with chest pain and shortness "
        "of breath. History of hypertension. Taking aspirin daily. ECG ordered. "
        "Pain radiates to left arm. Fatigue and dizziness noted."
    )

    print("\nTesting entity extraction...")
    print("=" * 50)
    result = extract_medical_entities(test_text)

    print(f"\nSuccess: {result['success']}")
    print(f"Found {result['total_entities']} entities:\n")

    for entity in result["entities"]:
        print(f"  - {entity['text']:<35} [{entity['label']}]")
