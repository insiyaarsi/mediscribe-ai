import spacy
from typing import Dict, List
from medical_categories import categorize_entities, categorize_entity, SYMPTOMS, MEDICATIONS, CONDITIONS, PROCEDURES

# Load the medical model (this happens once when the module is imported)
print("Loading scispacy medical model...")
nlp = spacy.load("en_core_sci_sm")
print("Medical model loaded successfully!")


def is_valid_medical_term(text):
    """
    Check if text is a valid medical term in our dictionaries.
    This is DYNAMIC - it uses the existing medical dictionaries.
    
    Args:
        text: The text to check (case-insensitive)
    
    Returns:
        bool: True if found in any medical dictionary
    """
    text_lower = text.lower()
    
    # Check all medical dictionaries
    all_terms = SYMPTOMS | MEDICATIONS | CONDITIONS | PROCEDURES
    
    # Exact match
    if text_lower in all_terms:
        return True
    
    # Partial match (for multi-word terms)
    for term in all_terms:
        if text_lower == term or text_lower in term or term in text_lower:
            return True
    
    return False


def is_exact_medical_term(text):
    """
    Check if text is an EXACT medical term in our dictionaries.
    No partial matching - must be exact match only.
    
    Args:
        text: The text to check (case-insensitive)
    
    Returns:
        bool: True if exact match found in any medical dictionary
    """
    text_lower = text.lower().strip()
    
    # Check all medical dictionaries for EXACT match only
    all_terms = SYMPTOMS | MEDICATIONS | CONDITIONS | PROCEDURES
    
    return text_lower in all_terms


def merge_adjacent_entities_dynamic(entities, original_text):
    """
    Dynamically merge adjacent entities if they form valid medical terms.
    Uses existing medical dictionaries - NO hardcoded whitelist!
    
    Example: "shortness" + "breath" → "shortness of breath" 
             (only if "shortness of breath" is in SYMPTOMS dictionary)
    
    Args:
        entities: List of entity dicts with 'text', 'start', 'end', 'label'
        original_text: The full transcription text
    
    Returns:
        List of merged entities
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
        
        # Check if there's a next entity
        if i + 1 < len(entities):
            next_entity = entities[i + 1]
            
            # Calculate distance between entities
            gap = next_entity['start'] - current['end']
            
            # Only try merging if entities are VERY close (within 5 characters)
            # This prevents merging across sentence boundaries
            if gap <= 5:
                # Extract the potential merged term
                merged_text = original_text[current['start']:next_entity['end']]
                
                # Skip if merged text contains sentence-ending punctuation
                if '.' in merged_text or '!' in merged_text or '?' in merged_text:
                    merged.append(current)
                    continue
                
                # Check if this EXACT merged text is in our dictionaries
                if is_exact_medical_term(merged_text):
                    merged_category = categorize_entity(merged_text)
                    
                    # Only merge if it's a meaningful medical category
                    if merged_category in ['symptom', 'medication', 'condition', 'procedure']:
                        merged_entity = {
                            'text': merged_text,
                            'label': current['label'],
                            'start': current['start'],
                            'end': next_entity['end']
                        }
                        merged.append(merged_entity)
                        skip_next = True
                        print(f"  ✓ Merged: '{current['text']}' + '{next_entity['text']}' → '{merged_text}' [{merged_category}]")
                        continue
        
        # If we didn't merge, add current entity as-is
        merged.append(current)
    
    return merged


def extract_medical_entities(text):
    """
    Extract and categorize medical entities from text using scispacy.
    
    Args:
        text (str): The transcribed medical text
        
    Returns:
        dict: Extracted entities with categories
    """
    print("\n" + "="*50)
    print("MEDICAL ENTITY EXTRACTION")
    print("="*50)
    
    try:
        # Process text with scispacy model
        doc = nlp(text)
        
        # Extract entities
        entities = []
        for ent in doc.ents:
            entities.append({
                "text": ent.text,
                "label": ent.label_,
                "start": ent.start_char,
                "end": ent.end_char
            })
        
        print(f"Found {len(entities)} raw entities from scispacy")
        
        # Dynamically merge adjacent entities based on medical dictionaries
        if len(entities) > 1:
            print("\nChecking for compound medical terms (dynamic)...")
            entities = merge_adjacent_entities_dynamic(entities, text)
            print(f"After dynamic merging: {len(entities)} entities")
        
        # Now categorize the merged entities
        categorized = categorize_entities(entities)
        
        # Count entities by category
        category_counts = {
            "symptoms": len(categorized["symptoms"]),
            "medications": len(categorized["medications"]),
            "conditions": len(categorized["conditions"]),
            "procedures": len(categorized["procedures"]),
            "clinical_terms": len(categorized["clinical_terms"]),
            "unknown": len(categorized["unknown"])
        }
        
        print("\nEntity breakdown:")
        for category, count in category_counts.items():
            print(f"  {category}: {count}")
        
        return {
            "success": True,
            "entities": entities,  # Merged entities with positions
            "categorized": categorized,  # Organized by category
            "category_counts": category_counts,
            "total_entities": len(entities)
        }
        
    except Exception as e:
        print(f"ERROR in entity extraction: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "entities": [],
            "categorized": {},
            "category_counts": {},
            "total_entities": 0
        }


# Test function to verify it works
if __name__ == "__main__":
    # Test with medical text containing compound terms
    test_text = "Patient is a 45-year-old male presenting with chest pain and shortness of breath. History of hypertension. Taking aspirin daily."
    
    print("\nTesting entity extraction...")
    print("=" * 50)
    result = extract_medical_entities(test_text)
    
    print(f"\nSuccess: {result['success']}")
    print(f"Found {result['total_entities']} entities:\n")
    
    for entity in result["entities"]:
        print(f"  - {entity['text']:<30} [{entity['label']}]")