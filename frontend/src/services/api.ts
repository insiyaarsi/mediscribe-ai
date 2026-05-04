// api.ts
// Axios instance plus all API call functions.
//
// Token handling: a request interceptor reads the JWT from localStorage and
// attaches it as "Authorization: Bearer <token>" on every outgoing request.
// This means individual call sites do not need to think about auth headers —
// the interceptor handles it transparently.

import axios from 'axios'
import type { EncounterType, HistoryEntry, NoteStyleProfile, TranscriptionResult } from '../types'

const TOKEN_KEY = 'mediscribe_token'

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string, remember?: boolean): void {
  if (remember === undefined) {
    if (localStorage.getItem(TOKEN_KEY)) {
      localStorage.setItem(TOKEN_KEY, token)
      sessionStorage.removeItem(TOKEN_KEY)
      return
    }

    sessionStorage.setItem(TOKEN_KEY, token)
    localStorage.removeItem(TOKEN_KEY)
    return
  }

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

const configuredBaseUrl = import.meta.env.VITE_API_URL
const apiBaseUrl =
  configuredBaseUrl === undefined
    ? 'http://localhost:8000'
    : configuredBaseUrl

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 600000,
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
  note_style_preset: 'balanced' | 'concise' | 'detailed'
  preferred_focus: 'general' | 'symptom_driven' | 'assessment_driven' | 'plan_driven'
  include_bullets_in_plan: boolean
  include_patient_friendly_language: boolean
}

const DEFAULT_NOTE_STYLE_PROFILE: NoteStyleProfile = {
  note_style_preset: 'balanced',
  preferred_focus: 'general',
  include_bullets_in_plan: false,
  include_patient_friendly_language: false,
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

export async function updateCurrentUser(payload: {
  first_name?: string
  last_name?: string
  specialty?: string
  hospital?: string
  license_no?: string
  note_style_preset?: NoteStyleProfile['note_style_preset']
  preferred_focus?: NoteStyleProfile['preferred_focus']
  include_bullets_in_plan?: boolean
  include_patient_friendly_language?: boolean
}): Promise<UserPublic> {
  const response = await api.put<UserPublic>('/api/auth/me', payload)
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

export function getUserStyleProfile(user: UserPublic): NoteStyleProfile {
  return {
    note_style_preset: user.note_style_preset ?? DEFAULT_NOTE_STYLE_PROFILE.note_style_preset,
    preferred_focus: user.preferred_focus ?? DEFAULT_NOTE_STYLE_PROFILE.preferred_focus,
    include_bullets_in_plan: user.include_bullets_in_plan ?? DEFAULT_NOTE_STYLE_PROFILE.include_bullets_in_plan,
    include_patient_friendly_language: user.include_patient_friendly_language ?? DEFAULT_NOTE_STYLE_PROFILE.include_patient_friendly_language,
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

  const clinicalRepresentation = data.clinical_representation as TranscriptionResult['clinical_representation'] | undefined
  const qualityReport = data.quality_report as TranscriptionResult['quality_report'] | undefined
  const qualityScore =
    typeof data.quality_score === 'number'
      ? data.quality_score
      : typeof qualityReport?.overall_score === 'number'
        ? qualityReport.overall_score
        : undefined

  const confidenceScore =
    typeof data.confidence_score === 'number'
      ? data.confidence_score
      : typeof (data.validation as { confidence_score?: unknown } | undefined)?.confidence_score === 'number'
        ? Number((data.validation as { confidence_score?: number }).confidence_score)
        : 0

  const resolvedEncounterType =
    typeof data.resolved_encounter_type === 'string'
      ? data.resolved_encounter_type as TranscriptionResult['resolved_encounter_type']
      : undefined

  const resolvedStyleProfile = data.resolved_style_profile as NoteStyleProfile | undefined

  return {
    ...(data as object),
    transcription:    typeof data.transcription === 'string' ? data.transcription : '',
    entities:         entities as TranscriptionResult['entities'],
    soap_note:        soapNote,
    resolved_encounter_type: resolvedEncounterType,
    resolved_style_profile: resolvedStyleProfile,
    clinical_representation: clinicalRepresentation,
    quality_report: qualityReport,
    quality_score: qualityScore,
    confidence_score: confidenceScore,
  } as TranscriptionResult
}

export async function transcribeAudio(
  file: File,
  options: {
    audioDurationSeconds?: number | null
    encounterType: EncounterType
    styleOverrides?: Partial<NoteStyleProfile>
  }
): Promise<TranscriptionResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('encounter_type', options.encounterType)
  if (options.styleOverrides?.note_style_preset) {
    formData.append('note_style_preset', options.styleOverrides.note_style_preset)
  }
  if (options.styleOverrides?.preferred_focus) {
    formData.append('preferred_focus', options.styleOverrides.preferred_focus)
  }
  if (typeof options.styleOverrides?.include_bullets_in_plan === 'boolean') {
    formData.append('include_bullets_in_plan', String(options.styleOverrides.include_bullets_in_plan))
  }
  if (typeof options.styleOverrides?.include_patient_friendly_language === 'boolean') {
    formData.append('include_patient_friendly_language', String(options.styleOverrides.include_patient_friendly_language))
  }
  const response = await api.post<TranscriptionResult>('/api/transcribe', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(typeof options.audioDurationSeconds === 'number' && Number.isFinite(options.audioDurationSeconds)
        ? { 'X-Audio-Duration-Seconds': String(options.audioDurationSeconds) }
        : {}),
    },
    timeout: 30 * 60 * 1000,
  })
  return normalizeTranscriptionResult(response.data)
}

export default api
