import axios from 'axios'
import type { TranscriptionResult } from '../types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 120000, // 2 minutes — Whisper can be slow on first run
})

function normalizeTranscriptionResult(payload: unknown): TranscriptionResult {
  const data = (payload ?? {}) as Record<string, unknown>

  // ── Entity extraction ───────────────────────────────────────────────────────
  // Backend returns entities as a nested object: { total, breakdown, categorized, all_entities[] }
  // OR as a flat array (fallback path). Both shapes are handled here.
  const rawEntities = data.entities
  const rawList: unknown[] = Array.isArray(rawEntities)
    ? rawEntities
    : Array.isArray((rawEntities as { all_entities?: unknown[] } | null)?.all_entities)
      ? (rawEntities as { all_entities: unknown[] }).all_entities
      : []

  // ── Label normalisation ─────────────────────────────────────────────────────
  // The NER model returns CHEMICAL and DISEASE labels.
  // The backend dictionary scan returns SYMPTOM, TEST, and PROCEDURE labels.
  //
  // For SYMPTOM/TEST/PROCEDURE entities, we preserve the label exactly so
  // getEntityCategory() in utils.ts can map them directly to the correct
  // EntityCategory without falling back to keyword matching.
  //
  // For CHEMICAL and DISEASE entities, the label is preserved as-is —
  // getEntityCategory() already handles those two cases.
  //
  // Prior to this fix, normalizeTranscriptionResult() was dropping all labels
  // except CHEMICAL/DISEASE by not reading the label field consistently,
  // meaning every entity ended up as CONDITION or MEDICATION regardless of
  // what the backend identified.
  const entities = rawList.map((e) => {
    const ent = (e ?? {}) as Record<string, unknown>
    const label = typeof ent.label === 'string' ? ent.label.toUpperCase() : 'UNKNOWN'

    return {
      text:       typeof ent.text === 'string' ? ent.text : '',
      label,
      confidence: typeof ent.confidence === 'number' ? ent.confidence : 0,
      start:      typeof ent.start === 'number' ? ent.start : 0,
      end:        typeof ent.end === 'number' ? ent.end : 0,
    }
  })

  // ── SOAP note ───────────────────────────────────────────────────────────────
  const soapNote = (data.soap_note ?? {
    subjective: '',
    objective:  '',
    assessment: '',
    plan:       '',
  }) as TranscriptionResult['soap_note']

  // ── Confidence score ────────────────────────────────────────────────────────
  // Backend returns confidence_score inside validation.confidence_score (0-1).
  // Normalise to a number here; addToHistory() converts to 0-100.
  const confidenceScore =
    typeof data.confidence_score === 'number'
      ? data.confidence_score
      : typeof (data.validation as { confidence_score?: unknown } | undefined)?.confidence_score === 'number'
        ? Number((data.validation as { confidence_score?: number }).confidence_score)
        : 0

  return {
    ...(data as object),
    transcription:    typeof data.transcription === 'string' ? data.transcription : '',
    entities:         entities as TranscriptionResult['entities'],
    soap_note:        soapNote,
    confidence_score: confidenceScore,
  } as TranscriptionResult
}

export async function transcribeAudio(file: File): Promise<TranscriptionResult> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post<TranscriptionResult>('/api/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return normalizeTranscriptionResult(response.data)
}

export default api
