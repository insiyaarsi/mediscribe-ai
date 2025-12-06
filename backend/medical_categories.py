"""
Medical entity categorization using keyword matching.
Maps extracted medical terms to specific categories: symptoms, medications, conditions, procedures.
"""

# Medical term dictionaries for categorization
SYMPTOMS = {
    # Pain-related (EXPANDED)
    "pain", "ache", "discomfort", "soreness", "tenderness",
    "chest pain", "abdominal pain", "back pain", "headache", "migraine",
    "arm pain", "left arm", "right arm",
    "sharp pain", "dull pain", "burning pain", "stabbing pain",
    "joint pain", "muscle pain", "neck pain", "shoulder pain",
    "knee pain", "hip pain", "leg pain", "foot pain",
    "lower back pain", "upper back pain", "pelvic pain",
    
    # Respiratory (EXPANDED)
    "cough", "shortness of breath", "wheezing", "dyspnea", "congestion",
    "shortness", "breath",
    "difficulty breathing", "rapid breathing", "labored breathing",
    "chest tightness", "productive cough", "dry cough",
    "nasal congestion", "sinus pressure", "runny nose", "stuffy nose",
    "sore throat", "hoarseness", "loss of voice",
    
    # Gastrointestinal (EXPANDED)
    "nausea", "vomiting", "diarrhea", "constipation", "bloating",
    "heartburn", "indigestion",
    "stomach pain", "cramping", "gas", "reflux", "acid reflux",
    "loss of appetite", "decreased appetite", "increased appetite",
    "difficulty swallowing", "abdominal discomfort",
    "upset stomach", "stomach cramps", "bloody stool", "black stool",
    
    # Neurological (EXPANDED)
    "dizziness", "vertigo", "numbness", "tingling", "weakness",
    "fatigue", "drowsiness",
    "confusion", "lightheadedness", "fainting", "syncope",
    "memory loss", "difficulty concentrating", "brain fog",
    "tremor", "seizure", "vision changes", "blurred vision",
    "double vision", "sensitivity to light", "headache",
    "loss of consciousness", "altered mental status",
    
    # Cardiovascular
    "palpitations", "rapid heartbeat", "irregular heartbeat",
    "chest pressure", "radiating pain", "heart racing",
    "slow heartbeat", "skipped heartbeat",
    
    # Musculoskeletal
    "stiffness", "limited range of motion", "swelling",
    "bruising", "inflammation", "muscle spasm", "cramps",
    "joint swelling", "reduced mobility",
    
    # Dermatological
    "rash", "itching", "hives", "redness", "skin lesion",
    "dry skin", "peeling", "blistering", "skin discoloration",
    "wound", "cut", "burn", "bruise",
    
    # Urinary
    "frequent urination", "painful urination", "blood in urine",
    "difficulty urinating", "urgency", "incontinence",
    
    # General (EXPANDED)
    "fever", "chills", "sweating", "night sweats",
    "weight loss", "weight gain", "malaise",
    "weakness", "lethargy", "loss of energy",
    "insomnia", "difficulty sleeping", "excessive sleepiness",
    "loss of balance", "unsteady gait", "falls"
}

MEDICATIONS = {
    # Pain relievers / NSAIDs (EXPANDED)
    "aspirin", "ibuprofen", "acetaminophen", "paracetamol", "naproxen",
    "tylenol", "advil", "motrin", "aleve",  # Brand names
    "celecoxib", "celebrex", "diclofenac", "meloxicam",
    
    # Cardiovascular (EXPANDED)
    "lisinopril", "atorvastatin", "metoprolol", "amlodipine", "losartan",
    "warfarin", "clopidogrel", "plavix", "lipitor", "crestor",
    "simvastatin", "pravastatin", "rosuvastatin",
    "carvedilol", "bisoprolol", "enalapril", "ramipril",
    "diltiazem", "verapamil", "nifedipine",
    "furosemide", "lasix", "hydrochlorothiazide", "spironolactone",
    "apixaban", "eliquis", "rivaroxaban", "xarelto",
    
    # Diabetes (EXPANDED)
    "metformin", "insulin", "glipizide", "glyburide",
    "glucophage", "jardiance", "empagliflozin",
    "sitagliptin", "januvia", "glimepiride",
    "pioglitazone", "actos", "lantus", "novolog", "humalog",
    
    # Antibiotics (EXPANDED)
    "amoxicillin", "azithromycin", "ciprofloxacin", "doxycycline",
    "augmentin", "z-pack", "zithromax", "levaquin",
    "cephalexin", "keflex", "clindamycin", "metronidazole",
    "trimethoprim", "bactrim", "penicillin", "ampicillin",
    
    # Respiratory / Allergy
    "albuterol", "ventolin", "proair", "fluticasone", "flonase",
    "montelukast", "singulair", "cetirizine", "zyrtec",
    "loratadine", "claritin", "diphenhydramine", "benadryl",
    "prednisone", "prednisolone",
    
    # Gastrointestinal (EXPANDED)
    "omeprazole", "prilosec", "esomeprazole", "nexium",
    "pantoprazole", "protonix", "lansoprazole", "prevacid",
    "ranitidine", "zantac", "famotidine", "pepcid",
    "ondansetron", "zofran", "metoclopramide", "reglan",
    
    # Mental Health
    "sertraline", "zoloft", "escitalopram", "lexapro",
    "fluoxetine", "prozac", "citalopram", "celexa",
    "paroxetine", "paxil", "venlafaxine", "effexor",
    "duloxetine", "cymbalta", "bupropion", "wellbutrin",
    "alprazolam", "xanax", "lorazepam", "ativan",
    "diazepam", "valium", "clonazepam", "klonopin",
    
    # Thyroid
    "levothyroxine", "synthroid", "liothyronine", "cytomel",
    "methimazole", "tapazole",
    
    # Pain Management (Opioids)
    "hydrocodone", "oxycodone", "morphine", "tramadol",
    "codeine", "fentanyl", "oxycontin", "vicodin", "percocet",
    
    # Other Common Medications
    "gabapentin", "neurontin", "pregabalin", "lyrica",
    "cyclobenzaprine", "flexeril", "tizanidine",
    "tamsulosin", "flomax", "finasteride", "propecia",
    "sildenafil", "viagra", "tadalafil", "cialis"
}

CONDITIONS = {
    # Cardiovascular (EXPANDED)
    "hypertension", "high blood pressure", "hypotension", "low blood pressure",
    "coronary artery disease", "heart disease", "arrhythmia", "atrial fibrillation",
    "heart failure", "congestive heart failure", "chf",
    "myocardial infarction", "heart attack", "mi",
    "angina", "stable angina", "unstable angina",
    "peripheral artery disease", "pad", "deep vein thrombosis", "dvt",
    "pulmonary embolism", "pe", "stroke", "cva",
    "cardiomyopathy", "pericarditis", "endocarditis",
    "mitral valve prolapse", "aortic stenosis",
    
    # Metabolic (EXPANDED)
    "diabetes", "type 2 diabetes", "type 1 diabetes", "dm", "t2dm", "t1dm",
    "prediabetes", "hypoglycemia", "hyperglycemia",
    "diabetic neuropathy", "diabetic retinopathy",
    "obesity", "metabolic syndrome", "morbid obesity",
    "high cholesterol", "hyperlipidemia", "hypercholesterolemia",
    "hypertriglyceridemia", "dyslipidemia",
    "hypothyroidism", "hyperthyroidism", "thyroid disorder",
    "hashimoto", "graves disease", "goiter",
    
    # Respiratory (EXPANDED)
    "asthma", "copd", "chronic obstructive pulmonary disease",
    "pneumonia", "bronchitis", "acute bronchitis", "chronic bronchitis",
    "emphysema", "pulmonary fibrosis", "interstitial lung disease",
    "sleep apnea", "obstructive sleep apnea", "osa",
    "tuberculosis", "tb", "lung cancer", "pleural effusion",
    
    # Infectious Diseases (EXPANDED)
    "covid-19", "coronavirus", "sars-cov-2",
    "influenza", "flu", "common cold", "upper respiratory infection", "uri",
    "pneumonia", "sepsis", "urinary tract infection", "uti",
    "cellulitis", "abscess", "infection",
    "gastroenteritis", "food poisoning", "norovirus",
    "herpes", "shingles", "chickenpox", "hiv", "hepatitis",
    
    # Musculoskeletal (EXPANDED)
    "arthritis", "osteoarthritis", "rheumatoid arthritis", "ra",
    "gout", "gouty arthritis", "osteoporosis", "osteopenia",
    "fibromyalgia", "chronic pain syndrome",
    "herniated disc", "bulging disc", "sciatica",
    "carpal tunnel syndrome", "rotator cuff tear",
    "fracture", "broken bone", "sprain", "strain",
    "tendinitis", "bursitis", "plantar fasciitis",
    
    # Neurological (EXPANDED)
    "migraine", "tension headache", "cluster headache",
    "epilepsy", "seizure disorder", "parkinson's disease",
    "alzheimer's disease", "dementia", "multiple sclerosis", "ms",
    "neuropathy", "peripheral neuropathy", "diabetic neuropathy",
    "bell's palsy", "trigeminal neuralgia",
    "concussion", "traumatic brain injury", "tbi",
    
    # Mental Health (EXPANDED)
    "depression", "major depressive disorder", "mdd",
    "anxiety", "generalized anxiety disorder", "gad",
    "panic disorder", "panic attacks", "social anxiety",
    "post-traumatic stress disorder", "ptsd",
    "bipolar disorder", "schizophrenia", "ocd",
    "obsessive compulsive disorder", "adhd",
    "attention deficit hyperactivity disorder",
    
    # Gastrointestinal (EXPANDED)
    "gastroesophageal reflux disease", "gerd", "acid reflux",
    "peptic ulcer", "stomach ulcer", "gastritis",
    "irritable bowel syndrome", "ibs", "crohn's disease",
    "ulcerative colitis", "inflammatory bowel disease", "ibd",
    "diverticulitis", "diverticulosis", "hemorrhoids",
    "celiac disease", "lactose intolerance",
    "gallstones", "cholecystitis", "pancreatitis",
    "cirrhosis", "fatty liver disease", "hepatitis",
    
    # Renal / Urological
    "chronic kidney disease", "ckd", "kidney failure", "renal failure",
    "kidney stones", "nephrolithiasis", "urinary tract infection", "uti",
    "benign prostatic hyperplasia", "bph", "enlarged prostate",
    "prostate cancer", "bladder cancer", "kidney cancer",
    
    # Endocrine
    "diabetes mellitus", "cushing syndrome", "addison's disease",
    "pituitary disorder", "acromegaly",
    
    # Dermatological
    "eczema", "psoriasis", "dermatitis", "acne",
    "rosacea", "skin cancer", "melanoma", "basal cell carcinoma",
    
    # Hematological
    "anemia", "iron deficiency anemia", "sickle cell disease",
    "thrombocytopenia", "leukemia", "lymphoma",
    
    # Oncological
    "cancer", "breast cancer", "colon cancer", "lung cancer",
    "prostate cancer", "metastatic cancer", "tumor", "malignancy"
}

PROCEDURES = {
    # Imaging (EXPANDED)
    "x-ray", "radiograph", "chest x-ray", "abdominal x-ray",
    "ct scan", "cat scan", "computed tomography",
    "mri", "magnetic resonance imaging", "brain mri", "spine mri",
    "ultrasound", "sonogram", "doppler ultrasound",
    "mammogram", "pet scan", "bone scan", "dexa scan",
    
    # Cardiac Tests (EXPANDED)
    "echocardiogram", "echo", "cardiac ultrasound",
    "ekg", "ecg", "electrocardiogram", "cardiac monitor",
    "stress test", "cardiac stress test", "treadmill test",
    "holter monitor", "event monitor", "cardiac catheterization",
    "angiogram", "coronary angiography",
    
    # Lab Tests (EXPANDED)
    "blood test", "blood work", "lab work", "laboratory tests",
    "complete blood count", "cbc", "comprehensive metabolic panel", "cmp",
    "basic metabolic panel", "bmp", "lipid panel", "cholesterol test",
    "hemoglobin a1c", "hba1c", "glucose test", "fasting glucose",
    "thyroid function test", "tsh", "liver function test", "lft",
    "kidney function test", "renal panel", "creatinine", "bun",
    "urinalysis", "urine test", "urine culture",
    "blood culture", "stool test", "stool culture",
    "coagulation panel", "pt", "inr", "ptt",
    "d-dimer", "troponin", "bnp", "creatine kinase",
    
    # Physical Examination (EXPANDED)
    "vital signs", "vitals", "blood pressure", "bp", "temperature",
    "pulse", "heart rate", "respiratory rate", "oxygen saturation",
    "examination", "physical exam", "physical examination",
    "assessment", "clinical assessment", "evaluation",
    "inspection", "palpation", "percussion", "auscultation",
    "neurological exam", "cardiac exam", "respiratory exam",
    "abdominal exam", "musculoskeletal exam",
    
    # Monitoring and Observation (EXPANDED)
    "monitor", "monitoring", "monitor vitals", "continuous monitoring",
    "observation", "clinical observation", "bedside monitoring",
    "telemetry", "cardiac monitoring", "pulse oximetry",
    "follow-up", "reassessment", "reevaluation",
    
    # Gastrointestinal Procedures
    "colonoscopy", "endoscopy", "upper endoscopy", "egd",
    "sigmoidoscopy", "esophagogastroduodenoscopy",
    
    # Respiratory Procedures
    "spirometry", "pulmonary function test", "pft",
    "bronchoscopy", "chest tube placement",
    
    # Surgical Procedures
    "biopsy", "tissue biopsy", "needle biopsy", "excisional biopsy",
    "surgery", "surgical procedure", "operation",
    "incision and drainage", "sutures", "stitches",
    "catheterization", "foley catheter", "central line",
    "iv placement", "intravenous access",
    
    # Therapeutic Procedures
    "injection", "intramuscular injection", "subcutaneous injection",
    "infusion", "iv infusion", "medication administration",
    "wound care", "dressing change", "debridement",
    "physical therapy", "pt", "occupational therapy", "ot",
    "nebulizer treatment", "breathing treatment",
    
    # Vaccinations
    "vaccination", "immunization", "vaccine", "flu shot",
    "covid vaccine", "pneumonia vaccine", "tetanus shot"
}

# Clinical terms that are medical but don't fit our main categories
# These are descriptive terms, not actionable clinical information
CLINICAL_TERMS = {
    "patient", "stable", "unstable", "management", "treatment",
    "clinical progression", "progression", "history", "presentation",
    "status", "condition", "response", "therapy", "care",
    "male", "female", "presenting", "reports", "complains",
    "year-old", "years old", "age", "old",
    "acute", "chronic", "severe", "mild", "moderate",
    "admitted", "discharged", "hospitalized", "outpatient",
    "diagnosis", "prognosis", "etiology", "pathology"
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
        "clinical_terms": [],
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