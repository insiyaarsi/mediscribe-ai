import { create } from 'zustand'
import type { AppPage, HistoryEntry, TranscriptionResult, UploadState } from '../types'
import { formatDate, generatePatientId } from '../lib/utils'

interface AppState {
  // Navigation
  currentPage:   AppPage
  setPage:       (page: AppPage) => void

  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar:    () => void

  // Upload & transcription
  uploadState:      UploadState
  selectedFile:     File | null
  transcriptionResult: TranscriptionResult | null
  processingStatus: string
  errorMessage:     string | null

  setFile:          (file: File | null) => void
  setUploadState:   (state: UploadState) => void
  setProcessingStatus: (status: string) => void
  setResult:        (result: TranscriptionResult) => void
  setError:         (msg: string | null) => void
  clearUpload:      () => void

  // History
  history:          HistoryEntry[]
  addToHistory:     (result: TranscriptionResult, file: File) => void
  deleteHistoryItem:(id: string) => void
  clearHistory:     () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentPage: 'dashboard',
  setPage: (page) => set({ currentPage: page }),

  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // Upload & transcription
  uploadState:          'idle',
  selectedFile:         null,
  transcriptionResult:  null,
  processingStatus:     '',
  errorMessage:         null,

  setFile:          (file) => set({ selectedFile: file, uploadState: file ? 'selected' : 'idle', errorMessage: null }),
  setUploadState:   (state) => set({ uploadState: state }),
  setProcessingStatus: (status) => set({ processingStatus: status }),
  setResult:        (result) => set({ transcriptionResult: result, uploadState: 'done' }),
  setError:         (msg) => set({ errorMessage: msg, uploadState: 'error' }),
  clearUpload: () => set({
    uploadState: 'idle', selectedFile: null,
    transcriptionResult: null, processingStatus: '', errorMessage: null,
  }),

  // History
  history: [],
  addToHistory: (result, file) => {
    const entry: HistoryEntry = {
      id:              crypto.randomUUID(),
      date:            formatDate(new Date()),
      patientId:       generatePatientId(),
      duration:        `${Math.floor(file.size / 100000)}:${String(Math.floor(Math.random() * 59)).padStart(2,'0')}`,
      entityCount:     result.entities.length,
      confidenceScore: result.confidence_score > 1 ? result.confidence_score : result.confidence_score * 100,
      status:          'complete',
      result,
    }
    set((s) => ({ history: [entry, ...s.history] }))
  },
  deleteHistoryItem: (id) => set((s) => ({ history: s.history.filter(h => h.id !== id) })),
  clearHistory: () => set({ history: [] }),
}))