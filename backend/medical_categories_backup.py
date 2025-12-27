"""
Medical term categorization using keyword matching
Expanded with anatomical terms, clinical descriptors, and physical findings
"""

# ============================================================
# SYMPTOMS - Patient-reported complaints and physical findings
# ============================================================
SYMPTOMS = {
    # Pain types
    "pain", "ache", "discomfort", "soreness", "tenderness",
    "chest pain", "abdominal pain", "back pain", "joint pain", "muscle pain",
    "headache", "migraine", "toothache", "earache",
    "sharp pain", "dull pain", "burning pain", "stabbing pain", "throbbing pain",
    "radiating pain", "pressure-like pain",
    
    # Respiratory symptoms
    "cough", "shortness of breath", "wheezing", "dyspnea",
    "congestion", "runny nose", "sore throat", "hoarseness",
    "chest tightness", "difficulty breathing", "rapid breathing",
    "breath sounds", "crackles", "wheezes", "stridor",
    
    # Gastrointestinal symptoms
    "nausea", "vomiting", "diarrhea", "constipation",
    "heartburn", "indigestion", "bloating", "gas",
    "abdominal pain", "stomach pain", "cramping",
    "loss of appetite", "weight loss", "weight gain",
    
    # Neurological symptoms
    "dizziness", "vertigo", "lightheadedness", "fainting",
    "numbness", "tingling", "weakness", "tremor",
    "confusion", "memory loss", "seizure",
    "vision changes", "blurred vision", "double vision",
    "hearing loss", "tinnitus",
    
    # Cardiovascular symptoms
    "palpitations", "rapid heartbeat", "irregular heartbeat",
    "chest discomfort", "pressure",
    "swelling", "edema", "pitting edema", "leg swelling",
    
    # General symptoms
    "fatigue", "tiredness", "weakness", "malaise",
    "fever", "chills", "sweating", "night sweats", "diaphoretic",
    "insomnia", "difficulty sleeping", "sleep disturbance",
    "anxiety", "stress", "depression", "sadness",
    "loss of interest", "poor concentration",
    
    # Dermatological symptoms
    "rash", "itching", "hives", "lesion", "bruising",
    "redness", "swelling", "peeling", "dry skin",
    "discoloration", "bumps", "blisters",
    
    # Urinary symptoms
    "frequent urination", "urgent urination", "painful urination",
    "blood in urine", "dark urine", "cloudy urine",
    "incontinence", "difficulty urinating",
    
    # Musculoskeletal symptoms
    "stiffness", "limited mobility", "joint swelling",
    "muscle cramps", "muscle spasms",
    
    # Systemic symptoms
    "thirst", "increased thirst", "dehydration",
    "appetite changes", "mood changes",
    
    # Physical exam findings (NEW - Day 6)
    "distress", "mild distress", "moderate distress", "severe distress",
    "diaphoretic", "pale", "cyanotic", "jaundiced",
    "hyperinflation", "infiltrates",
    "jugular venous distention", "venous distention",
    "pulmonary congestion", "congestion",
}

# ============================================================
# MEDICATIONS - Drugs and prescriptions (generic + brand names)
# ============================================================
MEDICATIONS = {
    # Pain & Anti-inflammatory
    "aspirin", "ibuprofen", "naproxen", "acetaminophen",
    "tylenol", "advil", "aleve", "motrin",
    "celecoxib", "celebrex", "meloxicam", "mobic",
    "tramadol", "codeine", "morphine", "oxycodone",
    "hydrocodone", "vicodin", "percocet",
    
    # Cardiovascular
    "lisinopril", "enalapril", "losartan", "valsartan",
    "metoprolol", "atenolol", "carvedilol", "propranolol",
    "amlodipine", "norvasc", "diltiazem", "verapamil",
    "atorvastatin", "lipitor", "simvastatin", "zocor",
    "pravastatin", "rosuvastatin", "crestor",
    "warfarin", "coumadin", "apixaban", "eliquis",
    "clopidogrel", "plavix", "aspirin",
    "furosemide", "lasix", "hydrochlorothiazide", "hctz",
    "spironolactone", "aldactone",
    "digoxin", "lanoxin",
    "nitroglycerin", "nitro",
    
    # Diabetes
    "metformin", "glucophage", "insulin", "glipizide",
    "glyburide", "pioglitazone", "actos",
    "sitagliptin", "januvia", "empagliflozin", "jardiance",
    "insulin glargine", "lantus", "insulin lispro", "humalog",
    
    # Respiratory
    "albuterol", "proventil", "ventolin",
    "ipratropium", "atrovent", "ipratropium bromide",
    "fluticasone", "flovent", "budesonide", "pulmicort",
    "montelukast", "singulair",
    "prednisone", "prednisolone", "methylprednisolone",
    
    # Antibiotics
    "amoxicillin", "augmentin", "azithromycin", "zithromax",
    "ciprofloxacin", "cipro", "levofloxacin", "levaquin",
    "doxycycline", "cephalexin", "keflex",
    "trimethoprim", "bactrim", "sulfamethoxazole",
    
    # Mental Health
    "sertraline", "zoloft", "escitalopram", "lexapro",
    "fluoxetine", "prozac", "paroxetine", "paxil",
    "citalopram", "celexa", "venlafaxine", "effexor",
    "duloxetine", "cymbalta", "bupropion", "wellbutrin",
    "alprazolam", "xanax", "lorazepam", "ativan",
    "clonazepam", "klonopin", "diazepam", "valium",
    "zolpidem", "ambien", "trazodone",
    
    # Gastrointestinal
    "omeprazole", "prilosec", "esomeprazole", "nexium",
    "pantoprazole", "protonix", "lansoprazole", "prevacid",
    "ranitidine", "zantac", "famotidine", "pepcid",
    "ondansetron", "zofran", "metoclopramide", "reglan",
    
    # Thyroid
    "levothyroxine", "synthroid", "liothyronine", "cytomel",
    
    # Other
    "gabapentin", "neurontin", "pregabalin", "lyrica",
    "cyclobenzaprine", "flexeril",
    "sildenafil", "viagra", "tadalafil", "cialis",
    "finasteride", "propecia", "tamsulosin", "flomax",
    
    # Common misspellings from Whisper (NEW - Day 6)
    "methamin", "certraline", "spiranylactone", "hypertropium",
}

# ============================================================
# CONDITIONS - Diagnoses and diseases
# ============================================================
CONDITIONS = {
    # Cardiovascular
    "hypertension", "high blood pressure", "hypotension",
    "heart disease", "coronary artery disease", "CAD",
    "heart failure", "congestive heart failure", "CHF",
    "systolic heart failure", "diastolic heart failure",
    "myocardial infarction", "heart attack", "MI",
    "arrhythmia", "atrial fibrillation", "afib",
    "ventricular tachycardia", "bradycardia", "tachycardia",
    "angina", "stable angina", "unstable angina",
    "cardiomyopathy", "pericarditis", "endocarditis",
    "valvular disease", "aortic stenosis", "mitral regurgitation",
    "deep vein thrombosis", "DVT", "pulmonary embolism", "PE",
    "peripheral artery disease", "PAD",
    "irregular", "heart rate irregular", "rapid ventricular response",
    
    # Metabolic & Endocrine
    "diabetes", "diabetes mellitus", "type 1 diabetes", "type 2 diabetes",
    "diabetic ketoacidosis", "DKA", "hyperglycemia", "hypoglycemia",
    "prediabetes", "insulin resistance", "metabolic syndrome",
    "thyroid disorder", "hypothyroidism", "hyperthyroidism",
    "hashimoto", "graves disease", "goiter",
    "obesity", "overweight", "malnutrition",
    "high cholesterol", "hyperlipidemia", "dyslipidemia",
    "hypertriglyceridemia", "elevated cholesterol",
    
    # Respiratory
    "asthma", "COPD", "chronic obstructive pulmonary disease",
    "emphysema", "chronic bronchitis", "bronchitis",
    "pneumonia", "pneumonitis", "pleurisy", "pleural effusion",
    "pulmonary fibrosis", "interstitial lung disease",
    "sleep apnea", "obstructive sleep apnea", "OSA",
    "tuberculosis", "TB",
    
    # Infectious
    "infection", "bacterial infection", "viral infection",
    "upper respiratory infection", "URI", "common cold",
    "influenza", "flu", "COVID-19", "coronavirus",
    "sepsis", "septic shock", "bacteremia",
    "urinary tract infection", "UTI", "pyelonephritis",
    "cellulitis", "abscess",
    
    # Musculoskeletal
    "arthritis", "osteoarthritis", "rheumatoid arthritis", "RA",
    "gout", "pseudogout", "bursitis", "tendinitis",
    "fracture", "broken bone", "sprain", "strain",
    "osteoporosis", "osteopenia",
    "back pain", "sciatica", "herniated disc",
    "fibromyalgia", "myalgia",
    
    # Neurological
    "stroke", "CVA", "cerebrovascular accident", "TIA",
    "seizure disorder", "epilepsy", "migraine",
    "dementia", "Alzheimer's disease", "Parkinson's disease",
    "multiple sclerosis", "MS", "neuropathy",
    "peripheral neuropathy", "diabetic neuropathy",
    "carpal tunnel syndrome", "bell's palsy",
    
    # Mental Health
    "depression", "major depressive disorder", "MDD",
    "anxiety", "generalized anxiety disorder", "GAD",
    "panic disorder", "panic attack", "PTSD",
    "bipolar disorder", "schizophrenia",
    "obsessive compulsive disorder", "OCD",
    "attention deficit disorder", "ADD", "ADHD",
    
    # Gastrointestinal
    "GERD", "gastroesophageal reflux disease", "acid reflux",
    "gastritis", "peptic ulcer", "ulcer",
    "irritable bowel syndrome", "IBS",
    "inflammatory bowel disease", "IBD",
    "Crohn's disease", "ulcerative colitis",
    "diverticulitis", "diverticulosis",
    "hepatitis", "cirrhosis", "fatty liver",
    "pancreatitis", "cholecystitis", "gallstones",
    
    # Renal/Urological
    "chronic kidney disease", "CKD", "acute kidney injury", "AKI",
    "kidney stones", "nephrolithiasis",
    "renal failure", "end stage renal disease", "ESRD",
    "urinary tract infection", "UTI",
    "benign prostatic hyperplasia", "BPH",
    
    # Dermatological
    "eczema", "psoriasis", "dermatitis", "acne",
    "rosacea", "skin cancer", "melanoma",
    "cellulitis", "fungal infection",
    
    # Hematological
    "anemia", "iron deficiency anemia",
    "leukemia", "lymphoma", "multiple myeloma",
    "thrombocytopenia", "hemophilia",
    
    # Oncological
    "cancer", "malignancy", "tumor", "carcinoma",
    "breast cancer", "lung cancer", "colon cancer",
    "prostate cancer", "metastatic cancer",
    
    # Other
    "allergies", "allergic reaction", "anaphylaxis",
    "autoimmune disease", "lupus", "scleroderma",
    
    # Common misspellings/variations (NEW - Day 6)
    "diabetes malitis", "diabetic retinopathy",
    "bilaterally", "therapeutic",
}

# ============================================================
# PROCEDURES - Tests, imaging, and treatments
# ============================================================
PROCEDURES = {
    # Imaging
    "x-ray", "chest x-ray", "abdominal x-ray",
    "CT scan", "CAT scan", "computed tomography",
    "MRI", "magnetic resonance imaging",
    "ultrasound", "echocardiogram", "echo",
    "mammogram", "bone scan", "PET scan",
    "angiogram", "cardiac catheterization", "catheterization",
    
    # Cardiac Tests
    "ECG", "EKG", "electrocardiogram",
    "stress test", "cardiac stress test", "exercise stress test",
    "holter monitor", "event monitor",
    "echocardiography",
    
    # Lab Tests
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
    
    # Physical Examination
    "physical exam", "physical examination",
    "vital signs", "vitals", "blood pressure",
    "heart rate", "pulse", "respiratory rate",
    "temperature", "oxygen saturation", "pulse ox",
    "auscultation", "palpation", "percussion",
    
    # GI Procedures
    "endoscopy", "colonoscopy", "sigmoidoscopy",
    "biopsy", "tissue biopsy",
    
    # Respiratory Procedures
    "spirometry", "pulmonary function test", "PFT",
    "bronchoscopy", "intubation", "ventilation",
    "nebulizer", "nebulizer treatment", "nebulization",
    
    # Surgical/Interventional
    "surgery", "operation", "procedure",
    "biopsy", "incision", "drainage",
    "suturing", "stitches", "staples",
    "angioplasty", "stent placement",
    
    # Therapeutic
    "physical therapy", "PT", "occupational therapy", "OT",
    "rehabilitation", "rehab",
    "counseling", "therapy", "psychotherapy",
    "cognitive behavioral therapy", "CBT",
    
    # Monitoring & Follow-up
    "monitoring", "observation", "follow-up", "follow up",
    "assessment", "evaluation", "screening",
    "telemetry", "telemetry unit", "cardiac monitoring",
    
    # Vaccinations
    "vaccination", "immunization", "vaccine",
    "flu shot", "pneumonia vaccine", "COVID vaccine",
    
    # Mental Health Assessment
    "PHQ-9", "GAD-7", "mental status exam",
    
    # Other
    "consultation", "referral",
    "admission", "discharge", "hospitalization",
    "urgent", "emergency", "stat",
}

# ============================================================
# CLINICAL TERMS - Generic medical language (filtered out)
# ============================================================
CLINICAL_TERMS = {
    "patient", "male", "female", "history", "presenting",
    "acute", "chronic", "severe", "moderate", "mild",
    "significant", "notable", "unremarkable",
    "normal", "abnormal", "positive", "negative",
    "stable", "unstable", "controlled", "uncontrolled", "poorly controlled",
    "symptoms", "signs", "findings", "diagnosis",
    "treatment", "management", "care", "therapy",
    "medication", "drug", "prescription",
    "dose", "dosage", "frequency",
    "prognosis", "outcome", "response",
    "risk", "factor", "complications",
    "bilateral", "unilateral", "left", "right",
    "improved", "worsened", "persistent", "recurrent",
    "daily", "twice daily", "three times daily", "as needed",
}

# ============================================================
# NEW CATEGORY - ANATOMICAL TERMS (Day 6 Addition)
# ============================================================
ANATOMICAL_TERMS = {
    # Body parts
    "arm", "arms", "leg", "legs", "hand", "hands", "foot", "feet",
    "head", "neck", "chest", "abdomen", "back", "shoulder", "hip",
    "knee", "elbow", "wrist", "ankle", "jaw", "face",
    "heart", "lung", "lungs", "liver", "kidney", "kidneys",
    "stomach", "intestine", "colon", "bladder", "prostate",
    "brain", "spine", "muscle", "bone", "joint", "skin",
    
    # Directional terms
    "left", "right", "upper", "lower", "anterior", "posterior",
    "superior", "inferior", "medial", "lateral", "proximal", "distal",
    "bilateral", "bilaterally", "unilateral",
    
    # Regions
    "extremity", "extremities", "lower extremity", "upper extremity",
    "lower extremities", "upper extremities",
    "bases", "lung bases", "apex", "base",
    
    # Vascular/Cardiac anatomy
    "artery", "vein", "vessel", "aorta", "ventricle", "atrium",
    "valve", "jugular", "venous",
    
    # Other
    "tissue", "organ", "gland", "node", "lymph node",
}

# ============================================================
# NEW CATEGORY - CLINICAL MODIFIERS (Day 6 Addition)
# ============================================================
CLINICAL_MODIFIERS = {
    # Severity
    "mild", "moderate", "severe", "critical",
    "slight", "significant", "marked",
    
    # Temporal
    "acute", "chronic", "subacute",
    "sudden", "gradual", "progressive",
    "recent", "longstanding", "new onset",
    
    # Change descriptors
    "worsening", "improving", "stable", "unchanged",
    "increased", "decreased", "elevated", "reduced",
    "persistent", "intermittent", "constant", "recurrent",
    
    # Quality descriptors
    "sharp", "dull", "burning", "stabbing", "throbbing",
    "aching", "cramping", "pressure-like", "radiating",
    
    # Status
    "controlled", "uncontrolled", "poorly controlled", "well-controlled",
    "resolved", "unresolved", "ongoing", "active",
    
    # Urgency
    "urgent", "emergency", "elective", "routine",
    "stat", "immediate",
    
    # Negative findings
    "no", "without", "denies", "negative for",
    "absent", "none", "unremarkable",
}


def categorize_entity(entity_text):
    """
    Categorize a medical entity based on keyword matching.
    Now includes anatomical terms and clinical modifiers.
    
    Args:
        entity_text: Text of the medical entity
        
    Returns:
        str: Category name (symptom, medication, condition, procedure, 
             anatomical, modifier, clinical_term, or unknown)
    """
    text_lower = entity_text.lower().strip()
    
    # Check exact match first
    if text_lower in SYMPTOMS:
        return "symptom"
    if text_lower in MEDICATIONS:
        return "medication"
    if text_lower in CONDITIONS:
        return "condition"
    if text_lower in PROCEDURES:
        return "procedure"
    if text_lower in ANATOMICAL_TERMS:
        return "anatomical"
    if text_lower in CLINICAL_MODIFIERS:
        return "modifier"
    if text_lower in CLINICAL_TERMS:
        return "clinical_term"
    
    # Check partial match (for multi-word terms)
    for term in SYMPTOMS:
        if term in text_lower or text_lower in term:
            return "symptom"
    
    for term in MEDICATIONS:
        if term in text_lower or text_lower in term:
            return "medication"
    
    for term in CONDITIONS:
        if term in text_lower or text_lower in term:
            return "condition"
    
    for term in PROCEDURES:
        if term in text_lower or text_lower in term:
            return "procedure"
    
    for term in ANATOMICAL_TERMS:
        if term in text_lower or text_lower in term:
            return "anatomical"
    
    for term in CLINICAL_MODIFIERS:
        if term in text_lower or text_lower in term:
            return "modifier"
    
    for term in CLINICAL_TERMS:
        if term in text_lower or text_lower in term:
            return "clinical_term"
    
    return "unknown"


def categorize_entities(entities):
    """
    Categorize a list of medical entities.
    
    Args:
        entities: List of entity dicts from scispacy
        
    Returns:
        dict: Categorized entities with counts
    """
    categorized = {
        "symptoms": [],
        "medications": [],
        "conditions": [],
        "procedures": [],
        "anatomical": [],
        "modifiers": [],
        "clinical_terms": [],
        "unknown": []
    }
    
    for entity in entities:
        category = categorize_entity(entity['text'])
        entity['category'] = category
        categorized[f"{category}s" if category != "unknown" else category].append(entity)
    
    # Count entities in each category
    counts = {
        "symptoms": len(categorized["symptoms"]),
        "medications": len(categorized["medications"]),
        "conditions": len(categorized["conditions"]),
        "procedures": len(categorized["procedures"]),
        "anatomical": len(categorized["anatomical"]),
        "modifiers": len(categorized["modifiers"]),
        "clinical_terms": len(categorized["clinical_terms"]),
        "unknown": len(categorized["unknown"])
    }
    
    return {
        "categorized": categorized,
        "counts": counts,
        "total": sum(counts.values())
    }


# Statistics
print(f"Dictionary loaded:")
print(f"  Symptoms: {len(SYMPTOMS)} terms")
print(f"  Medications: {len(MEDICATIONS)} terms")
print(f"  Conditions: {len(CONDITIONS)} terms")
print(f"  Procedures: {len(PROCEDURES)} terms")
print(f"  Anatomical: {len(ANATOMICAL_TERMS)} terms")
print(f"  Modifiers: {len(CLINICAL_MODIFIERS)} terms")
print(f"  Clinical Terms: {len(CLINICAL_TERMS)} terms")
total = len(SYMPTOMS) + len(MEDICATIONS) + len(CONDITIONS) + len(PROCEDURES) + len(ANATOMICAL_TERMS) + len(CLINICAL_MODIFIERS) + len(CLINICAL_TERMS)
print(f"  TOTAL: {total} terms")