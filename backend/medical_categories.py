"""
Medical entity categorization using keyword matching.
Maps extracted medical terms to specific categories: symptoms, medications, conditions, procedures.
"""

# Medical term dictionaries for categorization
SYMPTOMS = {
    # Pain-related
    "pain", "ache", "discomfort", "soreness", "tenderness",
    "chest pain", "abdominal pain", "back pain", "headache", "migraine",
    "arm pain", "left arm", "right arm",  # Added anatomical pain locations
    
    # Respiratory
    "cough", "shortness of breath", "wheezing", "dyspnea", "congestion",
    "shortness", "breath",  # Added: handles when scispacy splits "shortness of breath"
    
    # Gastrointestinal
    "nausea", "vomiting", "diarrhea", "constipation", "bloating",
    "heartburn", "indigestion",
    
    # Neurological
    "dizziness", "vertigo", "numbness", "tingling", "weakness",
    "fatigue", "drowsiness",
    
    # General
    "fever", "chills", "sweating", "swelling", "rash",
    "itching", "bleeding", "bruising"
}

MEDICATIONS = {
    # Common pain relievers
    "aspirin", "ibuprofen", "acetaminophen", "paracetamol", "naproxen",
    
    # Cardiovascular
    "lisinopril", "atorvastatin", "metoprolol", "amlodipine", "losartan",
    "warfarin", "clopidogrel",
    
    # Diabetes
    "metformin", "insulin", "glipizide", "glyburide",
    
    # Antibiotics
    "amoxicillin", "azithromycin", "ciprofloxacin", "doxycycline",
    
    # Other common medications
    "omeprazole", "levothyroxine", "albuterol", "prednisone",
    "gabapentin", "hydrocodone"
}

CONDITIONS = {
    # Cardiovascular
    "hypertension", "high blood pressure", "hypotension", "low blood pressure",
    "coronary artery disease", "heart disease", "arrhythmia", "atrial fibrillation",
    "heart failure", "myocardial infarction", "heart attack",
    
    # Metabolic
    "diabetes", "type 2 diabetes", "type 1 diabetes", "hypoglycemia",
    "hyperglycemia", "obesity", "metabolic syndrome",
    "high cholesterol", "hyperlipidemia", "hypercholesterolemia",  # Added
    
    # Respiratory
    "asthma", "copd", "pneumonia", "bronchitis", "emphysema",
    
    # Infectious
    "covid-19", "coronavirus", "influenza", "flu", "infection",
    
    # Chronic conditions
    "arthritis", "osteoarthritis", "rheumatoid arthritis",
    "depression", "anxiety", "hypothyroidism", "hyperthyroidism"
}

PROCEDURES = {
    # Imaging
    "x-ray", "ct scan", "mri", "ultrasound", "mammogram",
    "echocardiogram", "ekg", "ecg", "electrocardiogram",
    
    # Lab tests
    "blood test", "blood work", "urinalysis", "urine test",
    "complete blood count", "cbc", "metabolic panel",
    "lipid panel", "cholesterol test",
    
    # Physical examination
    "vital signs", "vitals", "blood pressure", "temperature",
    "pulse", "heart rate", "respiratory rate",
    "examination", "physical exam", "assessment",
    
    # Monitoring and observation
    "monitor", "monitoring", "observation", "follow-up",
    "reassessment", "evaluation",
    
    # Procedures
    "biopsy", "colonoscopy", "endoscopy", "surgery",
    "injection", "infusion", "catheterization"
}

# Clinical terms that are medical but don't fit our main categories
# These are descriptive terms, not actionable clinical information
CLINICAL_TERMS = {
    "patient", "stable", "unstable", "management", "treatment",
    "clinical progression", "progression", "history", "presentation",
    "status", "condition", "response", "therapy", "care",
    "male", "female", "presenting", "reports", "complains",  # Added gender and clinical verbs
    "year-old", "years old", "age", "old"  # Added age descriptors
}


def categorize_entity(entity_text):
    """
    Categorize a medical entity into symptom, medication, condition, or procedure.
    
    Args:
        entity_text (str): The extracted medical entity text
        
    Returns:
        str: Category label ("symptom", "medication", "condition", "procedure", "clinical_term", or "unknown")
    """
    # Convert to lowercase for case-insensitive matching
    entity_lower = entity_text.lower().strip()
    
    # Filter out generic clinical terms first
    if entity_lower in CLINICAL_TERMS:
        return "clinical_term"
    
    # Check each category (order matters - more specific checks first)
    if entity_lower in MEDICATIONS:
        return "medication"
    
    if entity_lower in PROCEDURES:
        return "procedure"
    
    if entity_lower in CONDITIONS:
        return "condition"
    
    if entity_lower in SYMPTOMS:
        return "symptom"
    
    # Partial matching for multi-word terms
    # Example: "severe chest pain" contains "chest pain"
    for symptom in SYMPTOMS:
        if symptom in entity_lower:
            return "symptom"
    
    for condition in CONDITIONS:
        if condition in entity_lower:
            return "condition"
    
    for procedure in PROCEDURES:
        if procedure in entity_lower:
            return "procedure"
    
    for medication in MEDICATIONS:
        if medication in entity_lower:
            return "medication"
    
    # Check if it's a clinical term (partial match)
    for term in CLINICAL_TERMS:
        if term in entity_lower:
            return "clinical_term"
    
    # If no match found, return unknown
    return "unknown"


def categorize_entities(entities):
    """
    Categorize a list of medical entities.
    
    Args:
        entities (list): List of entity dictionaries from scispacy
        
    Returns:
        dict: Categorized entities organized by type
    """
    categorized = {
        "symptoms": [],
        "medications": [],
        "conditions": [],
        "procedures": [],
        "clinical_terms": [],  # Added new category
        "unknown": []
    }
    
    for entity in entities:
        entity_text = entity["text"]
        category = categorize_entity(entity_text)
        
        # Add category information to entity
        entity_with_category = {
            **entity,  # Keep all original fields (text, label, start, end)
            "category": category
        }
        
        # Add to appropriate list
        if category == "symptom":
            categorized["symptoms"].append(entity_with_category)
        elif category == "medication":
            categorized["medications"].append(entity_with_category)
        elif category == "condition":
            categorized["conditions"].append(entity_with_category)
        elif category == "procedure":
            categorized["procedures"].append(entity_with_category)
        elif category == "clinical_term":
            categorized["clinical_terms"].append(entity_with_category)
        else:
            categorized["unknown"].append(entity_with_category)
    
    return categorized