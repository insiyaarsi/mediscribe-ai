// ── API Response Types ────────────────────────────────────

export interface MedicalEntity {
  text: string
  label: string
  confidence: number
  start: number
  end: number
}

export interface SOAPNote {
  subjective: string
  objective:  string
  assessment: string
  plan:       string
}

export interface ClinicalRepresentation {
  patient?: Record<string, unknown>
  encounter?: Record<string, unknown>
  subjective_data?: Record<string, unknown>
  objective_data?: Record<string, unknown>
  assessment_context?: Record<string, unknown>
  plan_context?: Record<string, unknown>
  history_gaps?: string[]
  source_entities?: Record<string, unknown>
  structured_at?: string
}

export interface SOAPQualityReport {
  overall_score: number
  target_score: number
  passes_threshold: boolean
  section_scores: Record<string, number>
  section_issues: Record<string, string[]>
}

export interface TranscriptionResult {
  transcription:    string
  entities:         MedicalEntity[]
  soap_note:        SOAPNote
  confidence_score: number
  clinical_representation?: ClinicalRepresentation
  quality_report?: SOAPQualityReport
  quality_score?: number
  processing_time?: number
}

// ── Entity Category Types ─────────────────────────────────

export type EntityCategory =
  | 'SYMPTOM'
  | 'MEDICATION'
  | 'CONDITION'
  | 'PROCEDURE'
  | 'TEST'
  | 'OTHER'

export interface GroupedEntities {
  symptoms:   MedicalEntity[]
  medications:MedicalEntity[]
  conditions: MedicalEntity[]
  procedures: MedicalEntity[]
  tests:      MedicalEntity[]
  other:      MedicalEntity[]
}

// ── History Types ─────────────────────────────────────────

export interface HistoryEntry {
  id:              string
  date:            string
  patientId:       string
  duration:        string
  entityCount:     number
  confidenceScore: number
  status:          'complete' | 'processing' | 'failed'
  result?:         TranscriptionResult
}

// ── UI State Types ────────────────────────────────────────

export type UploadState = 'idle' | 'selected' | 'processing' | 'done' | 'error'

export type AppPage = 'login' | 'dashboard' | 'history' | 'settings'
