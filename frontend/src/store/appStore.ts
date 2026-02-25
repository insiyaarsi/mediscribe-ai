import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppPage, HistoryEntry, TranscriptionResult, UploadState } from '../types'
import { formatDate, generatePatientId } from '../lib/utils'

// ── Settings shape ────────────────────────────────────────
interface UserProfile {
  firstName:  string
  lastName:   string
  email:      string
  specialty:  string
  hospital:   string
  licenseNo:  string
  avatarUrl:  string | null
}

interface Preferences {
  autoScroll:     boolean
  compactView:    boolean
  showConfidence: boolean
  autoCopy:       boolean
  darkMode:       boolean
}

interface NotificationSettings {
  emailNotifs:    boolean
  transcriptDone: boolean
  weeklyReport:   boolean
}

const DEFAULT_PROFILE: UserProfile = {
  firstName:  'Insiya',
  lastName:   'Arsi',
  email:      'insiya@mediscribe.ai',
  specialty:  'General Practice',
  hospital:   '',
  licenseNo:  '',
  avatarUrl:  null,
}

const DEFAULT_PREFERENCES: Preferences = {
  autoScroll:     true,
  compactView:    false,
  showConfidence: true,
  autoCopy:       false,
  darkMode:       false,
}

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  emailNotifs:    false,
  transcriptDone: true,
  weeklyReport:   false,
}

interface AppState {
  // Navigation
  currentPage: AppPage
  setPage:     (page: AppPage) => void

  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar:    () => void

  // Upload & transcription
  uploadState:         UploadState
  selectedFile:        File | null
  transcriptionResult: TranscriptionResult | null
  processingStatus:    string
  errorMessage:        string | null

  setFile:             (file: File | null) => void
  setUploadState:      (state: UploadState) => void
  setProcessingStatus: (status: string) => void
  setResult:           (result: TranscriptionResult) => void
  setError:            (msg: string | null) => void
  clearUpload:         () => void

  // History
  history:             HistoryEntry[]
  addToHistory:        (result: TranscriptionResult, file: File) => void
  deleteHistoryItem:   (id: string) => void
  clearHistory:        () => void

  // Settings — persisted
  profile:             UserProfile
  preferences:         Preferences
  notifications:       NotificationSettings

  updateProfile:       (p: Partial<UserProfile>) => void
  updatePreferences:   (p: Partial<Preferences>) => void
  updateNotifications: (n: Partial<NotificationSettings>) => void
  resetSettings:       () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, _get) => ({
      // Navigation
      currentPage: 'login',
      setPage: (page) => set({ currentPage: page }),

      // Sidebar
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      // Upload & transcription — NOT persisted (reset on reload is correct)
      uploadState:         'idle',
      selectedFile:        null,
      transcriptionResult: null,
      processingStatus:    '',
      errorMessage:        null,

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
          duration:        `${Math.floor(file.size / 100000)}:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}`,
          entityCount:     result.entities.length,
          confidenceScore: result.confidence_score > 1 ? result.confidence_score : result.confidence_score * 100,
          status:          'complete',
          result,
        }
        set((s) => ({ history: [entry, ...s.history] }))
      },
      deleteHistoryItem: (id) => set((s) => ({ history: s.history.filter(h => h.id !== id) })),
      clearHistory: () => set({ history: [] }),

      // Settings
      profile: { ...DEFAULT_PROFILE },
      preferences: { ...DEFAULT_PREFERENCES },
      notifications: { ...DEFAULT_NOTIFICATIONS },

      updateProfile:       (p) => set((s) => ({ profile:       { ...s.profile,       ...p } })),
      updatePreferences:   (p) => set((s) => ({ preferences:   { ...s.preferences,   ...p } })),
      updateNotifications: (n) => set((s) => ({ notifications: { ...s.notifications, ...n } })),
      resetSettings: () => set({
        profile: { ...DEFAULT_PROFILE },
        preferences: { ...DEFAULT_PREFERENCES },
        notifications: { ...DEFAULT_NOTIFICATIONS },
      }),
    }),
    {
      name: 'mediscribe-storage',
      // Only persist these keys — skip non-serialisable File objects
      partialize: (s) => ({
        history:       s.history,
        profile:       s.profile,
        preferences:   s.preferences,
        notifications: s.notifications,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    }
  )
)
