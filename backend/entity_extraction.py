import spacy
from typing import Dict, List
from medical_categories import categorize_entities

# Load the medical model (this happens once when the module is imported)
print("Loading scispacy medical model...")
nlp = spacy.load("en_core_sci_sm")
print("Medical model loaded successfully!")

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
        
        print(f"Found {len(entities)} raw entities")
        
        # Categorize entities using our medical dictionaries
        categorized = categorize_entities(entities)
        
        # Count entities by category
        category_counts = {
            "symptoms": len(categorized["symptoms"]),
            "medications": len(categorized["medications"]),
            "conditions": len(categorized["conditions"]),
            "procedures": len(categorized["procedures"]),
            "clinical_terms": len(categorized["clinical_terms"]),  # Added
            "unknown": len(categorized["unknown"])
        }
        
        print("\nEntity breakdown:")
        for category, count in category_counts.items():
            print(f"  {category}: {count}")
        
        return {
            "success": True,
            "entities": entities,  # Original entities with positions
            "categorized": categorized,  # Organized by category
            "category_counts": category_counts,
            "total_entities": len(entities)
        }
        
    except Exception as e:
        print(f"ERROR in entity extraction: {str(e)}")
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
    # Test with medical text
    test_text = "Patient is a 45-year-old male presenting with chest pain and hypertension. Taking aspirin daily."
    
    print("\nTesting entity extraction...")
    print("=" * 50)
    result = extract_medical_entities(test_text)
    
    print(f"\nSuccess: {result['success']}")
    print(f"Found {result['entity_count']} entities:\n")
    
    for entity in result["entities"]:
        print(f"  - {entity['text']:<20} [{entity['label']}]")