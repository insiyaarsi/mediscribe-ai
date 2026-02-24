import axios from 'axios'
import type { TranscriptionResult } from '../types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 120000, // 2 minutes — Whisper can be slow on first run
})

function normalizeTranscriptionResult(payload: unknown): TranscriptionResult {
  const data = (payload ?? {}) as Record<string, unknown>

  const rawEntities = data.entities
  const entities = Array.isArray(rawEntities)
    ? rawEntities
    : Array.isArray((rawEntities as { all_entities?: unknown[] } | null)?.all_entities)
      ? (rawEntities as { all_entities: unknown[] }).all_entities
      : []

  const soapNote = (data.soap_note ?? {
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  }) as TranscriptionResult['soap_note']

  const confidenceScore =
    typeof data.confidence_score === 'number'
      ? data.confidence_score
      : typeof (data.validation as { confidence_score?: unknown } | undefined)?.confidence_score === 'number'
        ? Number((data.validation as { confidence_score?: number }).confidence_score)
        : 0

  return {
    ...(data as object),
    transcription: typeof data.transcription === 'string' ? data.transcription : '',
    entities: entities as TranscriptionResult['entities'],
    soap_note: soapNote,
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
