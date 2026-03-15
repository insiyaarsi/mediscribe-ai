// api.ts
// Axios instance plus all API call functions.
//
// Token handling: a request interceptor reads the JWT from localStorage and
// attaches it as "Authorization: Bearer <token>" on every outgoing request.
// This means individual call sites do not need to think about auth headers —
// the interceptor handles it transparently.

import axios from 'axios'
import type { HistoryEntry, TranscriptionResult } from '../types'

const TOKEN_KEY = 'mediscribe_token'

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string, remember = false): void {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token)
    sessionStorage.removeItem(TOKEN_KEY)
    return
  }

  sessionStorage.setItem(TOKEN_KEY, token)
  localStorage.removeItem(TOKEN_KEY)
}

export function clearStoredToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 120000,
})

// ── Request interceptor — attach JWT ─────────────────────────────────────────
// Every request goes through here before it is sent. If a token exists in
// localStorage, it is added to the Authorization header. If not, the request
// goes out unauthenticated (the backend will return 401 for protected routes).
api.interceptors.request.use((config) => {
  const token = getStoredToken()
  const isAuthRoute = config.url?.includes('/api/auth/login') ||
                      config.url?.includes('/api/auth/register')
  if (token && !isAuthRoute) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor — handle expired tokens ─────────────────────────────
// If any request returns 401, the token is expired or invalid. Clear it and
// redirect to login so the user is not stuck on a broken session.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthEndpoint =
        error.config?.url?.includes('/api/auth/login') ||
        error.config?.url?.includes('/api/auth/register')
      // Only force logout for non-auth endpoints — a 401 on /login just means
      // wrong credentials, not an expired session
      if (!isAuthEndpoint) {
        clearStoredToken()
        window.location.reload()
      }
    }
    return Promise.reject(error)
  }
)


// ── Auth ──────────────────────────────────────────────────────────────────────

export interface UserPublic {
  id:         number
  email:      string
  first_name: string
  last_name:  string
  specialty:  string | null
  hospital:   string | null
  license_no: string | null
}

export interface AuthResponse {
  access_token: string
  token_type:   string
  user:         UserPublic
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/auth/login', { email, password })
  return response.data
}

export async function registerUser(payload: {
  email:      string
  password:   string
  first_name: string
  last_name:  string
  specialty?: string
}): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/auth/register', payload)
  return response.data
}

export async function fetchCurrentUser(): Promise<UserPublic> {
  const response = await api.get<UserPublic>('/api/auth/me')
  return response.data
}

export async function deleteMyAccount(): Promise<void> {
  await api.delete('/api/auth/me')
}


// ── History ───────────────────────────────────────────────────────────────────

export interface HistoryEntryAPI {
  id:               number
  patient_id:       string
  filename:         string
  transcription:    string
  confidence_score: number
  duration:         string | null
  status:           string
  created_at:       string
  entities:         Array<{
    text: string; label: string; confidence: number; start: number; end: number
  }>
  soap_note: {
    subjective: string; objective: string; assessment: string; plan: string; source: string
  } | null
}

export async function fetchHistory(): Promise<HistoryEntryAPI[]> {
  const response = await api.get<HistoryEntryAPI[]>('/api/history')
  return response.data
}

export async function fetchTranscription(id: number): Promise<HistoryEntryAPI> {
  const response = await api.get<HistoryEntryAPI>(`/api/history/${id}`)
  return response.data
}

export async function deleteHistoryItem(id: number): Promise<void> {
  await api.delete(`/api/history/${id}`)
}

export async function deleteAllHistory(): Promise<void> {
  await api.delete('/api/history')
}

export function mapHistoryEntryFromApi(entry: HistoryEntryAPI): HistoryEntry {
  return {
    id:              String(entry.id),
    date:            new Date(entry.created_at).toLocaleString(),
    patientId:       entry.patient_id,
    duration:        entry.duration ?? '0:00',
    entityCount:     entry.entities.length,
    confidenceScore: entry.confidence_score,
    status:          mapHistoryStatus(entry.status),
    result:          undefined,
  }
}

export function mapHistoryDetailToResult(entry: HistoryEntryAPI): TranscriptionResult {
  return {
    transcription: entry.transcription,
    entities: entry.entities.map((entity) => ({
      text: entity.text,
      label: entity.label.toUpperCase(),
      confidence: entity.confidence,
      start: entity.start,
      end: entity.end,
    })),
    soap_note: {
      subjective: entry.soap_note?.subjective ?? '',
      objective:  entry.soap_note?.objective ?? '',
      assessment: entry.soap_note?.assessment ?? '',
      plan:       entry.soap_note?.plan ?? '',
    },
    confidence_score: entry.confidence_score,
  }
}

function mapHistoryStatus(status: string): HistoryEntry['status'] {
  const normalized = status.toLowerCase()
  if (normalized === 'complete' || normalized === 'completed' || normalized === 'success') {
    return 'complete'
  }
  if (normalized === 'processing' || normalized === 'pending' || normalized === 'in_progress') {
    return 'processing'
  }
  return 'failed'
}


// ── Transcription ─────────────────────────────────────────────────────────────

function normalizeTranscriptionResult(payload: unknown): TranscriptionResult {
  const data = (payload ?? {}) as Record<string, unknown>

  const rawEntities = data.entities
  const rawList: unknown[] = Array.isArray(rawEntities)
    ? rawEntities
    : Array.isArray((rawEntities as { all_entities?: unknown[] } | null)?.all_entities)
      ? (rawEntities as { all_entities: unknown[] }).all_entities
      : []

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

  const soapNote = (data.soap_note ?? {
    subjective: '', objective: '', assessment: '', plan: '',
  }) as TranscriptionResult['soap_note']

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
