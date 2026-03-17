// appStore.ts
// Zustand store.
//
// Auth changes from the previous version:
// - Added `authToken` and `currentUser` state (not persisted to localStorage —
//   the token lives in localStorage directly, managed by api.ts interceptor)
// - `profile` is now populated from the JWT login response instead of hardcoded
// - History is still stored in Zustand for UI responsiveness, but is loaded from
//   the API on login and written to the API on new transcriptions. The Zustand
//   history array acts as the in-memory cache of the server state.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppPage, HistoryEntry, TranscriptionResult, UploadState } from '../types'
import { formatDate } from '../lib/utils'
import { clearStoredToken, type UserPublic } from '../services/api'

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
  firstName:  '',
  lastName:   '',
  email:      '',
  specialty:  '',
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

  // Auth
  isAuthenticated: boolean
  authUser:        UserPublic | null
  setAuth:         (user: UserPublic) => void
  clearAuth:       () => void

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

  // History — loaded from API on login, cached in Zustand for UI
  history:           HistoryEntry[]
  addToHistory:      (result: TranscriptionResult, file: File) => void
  setHistory:        (entries: HistoryEntry[]) => void
  deleteHistoryItem: (id: string) => void
  clearHistory:      () => void

  // Settings
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

      // Auth
      // isAuthenticated and authUser are not persisted — on reload the app
      // starts at the login page. The token in localStorage is used by api.ts
      // to attempt a session restore via GET /api/auth/me (handled in App.tsx).
      isAuthenticated: false,
      authUser: null,
      setAuth: (user) => {
        set({
          isAuthenticated: true,
          authUser: user,
          history: [],          // clear previous user's history before loading new user's
          profile: {
            firstName: user.first_name,
            lastName:  user.last_name,
            email:     user.email,
            specialty: user.specialty ?? '',
            hospital:  user.hospital  ?? '',
            licenseNo: user.license_no ?? '',
            avatarUrl: null,
          },
        })
      },
      clearAuth: () => {
        clearStoredToken()
        set({
          isAuthenticated: false,
          authUser:        null,
          currentPage:     'login',
          history:         [],
          profile:         { ...DEFAULT_PROFILE },
        })
      },

      // Upload & transcription
      uploadState:         'idle',
      selectedFile:        null,
      transcriptionResult: null,
      processingStatus:    '',
      errorMessage:        null,

      setFile:             (file) => set({ selectedFile: file, uploadState: file ? 'selected' : 'idle', errorMessage: null }),
      setUploadState:      (state) => set({ uploadState: state }),
      setProcessingStatus: (status) => set({ processingStatus: status }),
      setResult:           (result) => set({ transcriptionResult: result, uploadState: 'done' }),
      setError:            (msg) => set({ errorMessage: msg, uploadState: 'error' }),
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
          patientId:       `PT-${Math.floor(Math.random() * 90000) + 10000}`,
          duration:        `${Math.floor(file.size / 100000)}:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}`,
          entityCount:     result.entities.length,
          confidenceScore: result.confidence_score > 1 ? result.confidence_score : result.confidence_score * 100,
          status:          'complete',
          result,
        }
        set((s) => ({ history: [entry, ...s.history] }))
      },
      setHistory: (entries) => set({ history: entries }),
      deleteHistoryItem: (id) => set((s) => ({ history: s.history.filter(h => h.id !== id) })),
      clearHistory: () => set({ history: [] }),

      // Settings
      profile:       { ...DEFAULT_PROFILE },
      preferences:   { ...DEFAULT_PREFERENCES },
      notifications: { ...DEFAULT_NOTIFICATIONS },

      updateProfile:       (p) => set((s) => ({ profile:       { ...s.profile,       ...p } })),
      updatePreferences:   (p) => set((s) => ({ preferences:   { ...s.preferences,   ...p } })),
      updateNotifications: (n) => set((s) => ({ notifications: { ...s.notifications, ...n } })),
      resetSettings: () => set({
        preferences:   { ...DEFAULT_PREFERENCES },
        notifications: { ...DEFAULT_NOTIFICATIONS },
      }),
    }),
    {
      name: 'mediscribe-storage',
      partialize: (s) => ({
        preferences:      s.preferences,
        notifications:    s.notifications,
        sidebarCollapsed: s.sidebarCollapsed,
        // history and profile are intentionally excluded — they come from the API
      }),
    }
  )
)
