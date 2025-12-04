import spacy
from typing import Dict, List

# Load the medical model (this happens once when the module is imported)
print("Loading scispacy medical model...")
nlp = spacy.load("en_core_sci_sm")
print("Medical model loaded successfully!")

def extract_medical_entities(text: str) -> Dict:
    """
    Extract medical entities from transcribed text.
    
    Args:
        text: The transcribed medical text
        
    Returns:
        Dictionary containing categorized medical entities
    """
    try:
        # Process the text with scispacy
        doc = nlp(text)
        
        # Initialize result structure
        entities = {
            "success": True,
            "entities": [],
            "entity_count": 0,
            "error": None
        }
        
        # Extract all entities found by the model
        for ent in doc.ents:
            entity_info = {
                "text": ent.text,
                "label": ent.label_,  # Entity type (e.g., DISEASE, CHEMICAL)
                "start": ent.start_char,  # Position in text
                "end": ent.end_char
            }
            entities["entities"].append(entity_info)
        
        entities["entity_count"] = len(entities["entities"])
        
        return entities
        
    except Exception as e:
        print(f"Error in entity extraction: {str(e)}")
        return {
            "success": False,
            "entities": [],
            "entity_count": 0,
            "error": str(e)
        }

# Test function to verify it works
if __name__ == "__main__":
    # Test with medical text
    test_text = "Patient is a 45-year-old male presenting with chest pain and hypertension. Taking aspirin daily."
    
    print("\nTesting entity extraction...")
    print("=" * 50)
    result = extract_medical_entities(test_text)
    
    print(f"\nSuccess: {result['success']}")
    print(f"Found {result['entity_count']} entities:\n")
    
    for entity in result["entities"]:
        print(f"  - {entity['text']:<20} [{entity['label']}]")