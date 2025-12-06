"""
SOAP note generation from categorized medical entities.
Converts extracted entities into structured clinical documentation.
"""

from datetime import datetime


def generate_soap_note(transcription, categorized_entities):
    """
    Generate a SOAP (Subjective, Objective, Assessment, Plan) note
    from transcribed text and categorized medical entities.
    
    Args:
        transcription (str): Full transcription text
        categorized_entities (dict): Categorized medical entities
        
    Returns:
        dict: Structured SOAP note
    """
    
    # Extract entity lists
    symptoms = categorized_entities.get("symptoms", [])
    conditions = categorized_entities.get("conditions", [])
    medications = categorized_entities.get("medications", [])
    procedures = categorized_entities.get("procedures", [])
    
    # Build SOAP sections
    soap_note = {
        "generated_at": datetime.now().isoformat(),
        "subjective": generate_subjective(transcription, symptoms),
        "objective": generate_objective(procedures),
        "assessment": generate_assessment(conditions),
        "plan": generate_plan(medications, procedures)
    }
    
    return soap_note


def generate_subjective(transcription, symptoms):
    """
    Generate Subjective section - patient's reported symptoms and history.
    
    Args:
        transcription (str): Full transcription text
        symptoms (list): List of symptom entities
        
    Returns:
        dict: Subjective section content
    """
    
    # Extract symptom texts
    symptom_list = [s["text"] for s in symptoms]
    
    # Create chief complaint (first sentence or symptoms summary)
    chief_complaint = "Patient reports: " + ", ".join(symptom_list) if symptom_list else "No specific complaints documented."
    
    return {
        "chief_complaint": chief_complaint,
        "symptoms": symptom_list,
        "symptom_count": len(symptom_list),
        "narrative": transcription.strip()
    }


def generate_objective(procedures):
    """
    Generate Objective section - measurable findings and procedures.
    
    Args:
        procedures (list): List of procedure entities
        
    Returns:
        dict: Objective section content
    """
    
    procedure_list = [p["text"] for p in procedures]
    
    # Format procedures as clinical findings
    findings = []
    for proc in procedure_list:
        if proc in ["vitals", "vital signs"]:
            findings.append("Vital signs monitored")
        elif proc in ["monitor", "monitoring"]:
            findings.append("Patient under observation")
        else:
            findings.append(f"{proc.title()} performed")
    
    return {
        "findings": findings if findings else ["Physical examination performed"],
        "procedures": procedure_list,
        "procedure_count": len(procedure_list)
    }


def generate_assessment(conditions):
    """
    Generate Assessment section - diagnoses and conditions.
    
    Args:
        conditions (list): List of condition entities
        
    Returns:
        dict: Assessment section content
    """
    
    condition_list = [c["text"] for c in conditions]
    
    # Create primary diagnosis
    if condition_list:
        primary_diagnosis = condition_list[0]
        additional_diagnoses = condition_list[1:] if len(condition_list) > 1 else []
    else:
        primary_diagnosis = "Assessment pending further evaluation"
        additional_diagnoses = []
    
    return {
        "primary_diagnosis": primary_diagnosis,
        "additional_diagnoses": additional_diagnoses,
        "all_conditions": condition_list,
        "condition_count": len(condition_list)
    }


def generate_plan(medications, procedures):
    """
    Generate Plan section - treatment plan, medications, follow-up.
    
    Args:
        medications (list): List of medication entities
        procedures (list): List of procedure entities
        
    Returns:
        dict: Plan section content
    """
    
    medication_list = [m["text"] for m in medications]
    procedure_list = [p["text"] for p in procedures]
    
    # Build treatment plan
    plan_items = []
    
    if medication_list:
        plan_items.append(f"Medications: {', '.join(medication_list)}")
    
    if procedure_list:
        plan_items.append(f"Procedures: {', '.join(procedure_list)}")
    
    if not plan_items:
        plan_items.append("Continue monitoring and supportive care")
    
    return {
        "treatment_plan": plan_items,
        "medications": medication_list,
        "follow_up_procedures": procedure_list,
        "medication_count": len(medication_list),
        "follow_up": "Schedule follow-up appointment as needed"
    }


def format_soap_note_text(soap_note):
    """
    Format SOAP note as readable text for display or export.
    
    Args:
        soap_note (dict): Structured SOAP note
        
    Returns:
        str: Formatted SOAP note text
    """
    
    text = []
    text.append("=" * 60)
    text.append("SOAP NOTE")
    text.append(f"Generated: {soap_note['generated_at']}")
    text.append("=" * 60)
    text.append("")
    
    # Subjective
    text.append("SUBJECTIVE:")
    text.append(f"  Chief Complaint: {soap_note['subjective']['chief_complaint']}")
    if soap_note['subjective']['symptoms']:
        text.append(f"  Symptoms: {', '.join(soap_note['subjective']['symptoms'])}")
    text.append("")
    
    # Objective
    text.append("OBJECTIVE:")
    for finding in soap_note['objective']['findings']:
        text.append(f"  - {finding}")
    text.append("")
    
    # Assessment
    text.append("ASSESSMENT:")
    text.append(f"  Primary Diagnosis: {soap_note['assessment']['primary_diagnosis']}")
    if soap_note['assessment']['additional_diagnoses']:
        text.append(f"  Additional Diagnoses: {', '.join(soap_note['assessment']['additional_diagnoses'])}")
    text.append("")
    
    # Plan
    text.append("PLAN:")
    for item in soap_note['plan']['treatment_plan']:
        text.append(f"  - {item}")
    text.append(f"  - {soap_note['plan']['follow_up']}")
    text.append("")
    text.append("=" * 60)
    
    return "\n".join(text)