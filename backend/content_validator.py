"""
Content Validator for MediScribe AI
Validates whether transcribed audio contains medical content before processing.
"""

from medical_categories import (
    SYMPTOMS, MEDICATIONS, CONDITIONS, PROCEDURES, 
    ANATOMICAL_TERMS, CLINICAL_MODIFIERS, CLINICAL_TERMS
)

# Clinical context markers that indicate medical content
CLINICAL_MARKERS = [
    # Patient presentation
    "patient", "presenting", "chief complaint", "history of present illness",
    "hpi", "complains of", "reports", "denies",
    
    # Physical examination
    "physical exam", "examination", "vital signs", "vitals", "blood pressure",
    "heart rate", "temperature", "respiratory rate", "pulse", "bp",
    
    # Medical history
    "medical history", "past medical history", "pmh", "surgical history",
    "family history", "social history", "allergies", "medications",
    
    # Clinical assessment
    "diagnosis", "assessment", "impression", "differential", "plan",
    "treatment", "follow up", "prognosis",
    
    # Temporal medical phrases
    "year old", "years old", "month old", "day old", "week old",
    "male", "female", "admitted", "discharged", "hospitalized",
    
    # Common medical abbreviations
    "mg", "ml", "mcg", "kg", "lbs", "mmhg", "bpm", "°f", "°c"
]

def calculate_medical_term_density(text: str) -> float:
    """
    Calculate the percentage of words in text that are medical terms.
    
    Args:
        text: Transcribed text to analyze
        
    Returns:
        Float between 0 and 1 representing medical term density
    """
    if not text or len(text.strip()) == 0:
        return 0.0
    
    # Convert to lowercase for matching
    text_lower = text.lower()
    words = text_lower.split()
    
    if len(words) == 0:
        return 0.0
    
    # Combine all medical dictionaries
    all_medical_terms = set()
    for term_list in [SYMPTOMS, MEDICATIONS, CONDITIONS, PROCEDURES, 
                      ANATOMICAL_TERMS, CLINICAL_MODIFIERS, CLINICAL_TERMS]:
        all_medical_terms.update([term.lower() for term in term_list])
    
    # Count medical terms found in text
    medical_word_count = 0
    for word in words:
        # Check single word
        if word in all_medical_terms:
            medical_word_count += 1
            continue
        
        # Check if word is part of multi-word medical term
        for term in all_medical_terms:
            if ' ' in term and word in term.split():
                medical_word_count += 1
                break
    
    density = medical_word_count / len(words)
    return density

def check_clinical_markers(text: str) -> dict:
    """
    Check for clinical context markers that indicate medical content.
    
    Args:
        text: Transcribed text to analyze
        
    Returns:
        Dict with marker_count and found_markers list
    """
    text_lower = text.lower()
    found_markers = []
    
    for marker in CLINICAL_MARKERS:
        if marker in text_lower:
            found_markers.append(marker)
    
    return {
        "marker_count": len(found_markers),
        "found_markers": found_markers
    }

def validate_medical_content(transcription: str, 
                            min_density: float = 0.10,
                            min_markers: int = 2) -> dict:
    """
    Validate whether transcription contains medical content.
    
    Args:
        transcription: The transcribed text to validate
        min_density: Minimum medical term density required (default 10%)
        min_markers: Minimum number of clinical markers required (default 2)
        
    Returns:
        Dict with validation results:
        {
            "is_valid": bool,
            "confidence_score": float,
            "reason": str,
            "details": {
                "medical_term_density": float,
                "clinical_markers_found": int,
                "found_markers": list
            }
        }
    """
    if not transcription or len(transcription.strip()) == 0:
        return {
            "is_valid": False,
            "confidence_score": 0.0,
            "reason": "Empty transcription provided",
            "details": {
                "medical_term_density": 0.0,
                "clinical_markers_found": 0,
                "found_markers": []
            }
        }
    
    # Calculate metrics
    density = calculate_medical_term_density(transcription)
    marker_check = check_clinical_markers(transcription)
    marker_count = marker_check["marker_count"]
    
    # Calculate confidence score (weighted average)
    # 70% weight on density, 30% weight on markers
    density_score = min(density / min_density, 1.0)
    marker_score = min(marker_count / min_markers, 1.0)
    confidence_score = (0.7 * density_score) + (0.3 * marker_score)
    
    # Validation logic: BOTH conditions must be met
    is_valid = (density >= min_density) and (marker_count >= min_markers)
    
    # Generate reason message
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
            "medical_term_density": round(density, 3),
            "clinical_markers_found": marker_count,
            "found_markers": marker_check["found_markers"][:5]  # Show first 5 markers
        }
    }

# Testing function
if __name__ == "__main__":
    # Test with non-medical content (Heated Rivalry review)
    non_medical = """Ok, let's talk about heated rivalry. This show is pure tension from the very first moment. 
    It's not just about hockey, it's about ego, competition, and two people who absolutely refuse to lose."""
    
    result1 = validate_medical_content(non_medical)
    print("Non-Medical Content Test:")
    print(f"Valid: {result1['is_valid']}")
    print(f"Confidence: {result1['confidence_score']}")
    print(f"Reason: {result1['reason']}")
    print(f"Details: {result1['details']}")
    print("\n" + "="*60 + "\n")
    
    # Test with medical content
    medical = """Patient is a 45 year old male presenting with chest pain and shortness of breath. 
    Vital signs show blood pressure 140/90, heart rate 88 bpm. Physical examination reveals clear lung sounds."""
    
    result2 = validate_medical_content(medical)
    print("Medical Content Test:")
    print(f"Valid: {result2['is_valid']}")
    print(f"Confidence: {result2['confidence_score']}")
    print(f"Reason: {result2['reason']}")
    print(f"Details: {result2['details']}")