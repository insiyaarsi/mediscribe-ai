import UploadZone from './UploadZone'
import TranscribeButton from './TranscribeButton'
import { useAppStore } from '../../../store/appStore'
import { AlertCircle } from 'lucide-react'
import { cn } from '../../../lib/utils'
import type { EncounterType, NoteStylePreset } from '../../../types'

const ENCOUNTER_OPTIONS: Array<{ value: EncounterType; label: string }> = [
  { value: 'acute_visit', label: 'Acute Visit' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'counselling_education', label: 'Counselling / Education' },
  { value: 'medication_review', label: 'Medication Review' },
]

const STYLE_PRESET_OPTIONS: Array<{ value: NoteStylePreset; label: string }> = [
  { value: 'balanced', label: 'Balanced' },
  { value: 'concise', label: 'Concise' },
  { value: 'detailed', label: 'Detailed' },
]

export default function UploadCard() {
  const {
    errorMessage,
    uploadState,
    preferences,
    profile,
    selectedEncounterType,
    styleOverridePreset,
    setEncounterType,
    setStyleOverridePreset,
  } = useAppStore()
  const isDone = uploadState === 'done'
  const dark   = preferences.darkMode
  const savedPreset = profile.noteStylePreset ?? 'balanced'
  const savedFocus = profile.preferredFocus ?? 'general'
  const activePreset = styleOverridePreset ?? savedPreset

  return (
    <div className={cn(
      'border rounded-[14px] p-7 mb-6',
      dark ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E2E8F0]'
    )}>
      <div className="mb-5">
        <h2 className={cn(
          'font-head text-[14.5px] font-semibold',
          dark ? 'text-[#F1F5F9]' : 'text-[#0D1B2A]'
        )}>
          Audio Transcription
        </h2>
        <p className="text-[12.5px] text-[#94A3B8] mt-1">
          Upload a doctor–patient conversation to generate a structured SOAP note
        </p>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className={cn(
          'flex items-start gap-3 p-4 mb-4 rounded-[10px] border text-[13px]',
          dark
            ? 'bg-[#3A1A1A] border-[#F87171]/30 text-[#FECACA]'
            : 'bg-red-50 border-red-200 text-red-700'
        )}>
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success banner */}
      {isDone && (
        <div className={cn(
          'flex items-center gap-3 p-4 mb-4 rounded-[10px] border text-[13px] font-medium',
          dark
            ? 'bg-[#0D3327] border-[#0BA871]/30 text-[#6EE7B7]'
            : 'bg-[#E6F7F2] border-[#0BA871]/30 text-[#065F46]'
        )}>
          Transcription complete — results displayed below
        </div>
      )}

      <div className={cn(
        'rounded-[12px] border p-4 mb-5',
        dark ? 'bg-[#0F172A] border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
      )}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className={cn(
              'text-[13px] font-semibold',
              dark ? 'text-[#F1F5F9]' : 'text-[#0D1B2A]'
            )}>
              Documentation Style
            </div>
            <p className="text-[12px] text-[#94A3B8] mt-1">
              Saved default: <span className="font-medium">{STYLE_PRESET_OPTIONS.find((option) => option.value === savedPreset)?.label ?? 'Balanced'}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStyleOverridePreset(null)}
            className={cn(
              'text-[12px] font-medium underline underline-offset-2 transition-colors',
              dark ? 'text-[#93C5FD]' : 'text-[#1A56DB]'
            )}
          >
            Use saved defaults
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={cn(
              'block text-[12px] font-semibold mb-2',
              dark ? 'text-[#E2E8F0]' : 'text-[#0D1B2A]'
            )}>
              Encounter Type
            </label>
            <select
              value={selectedEncounterType ?? ''}
              onChange={(e) => setEncounterType((e.target.value || null) as EncounterType | null)}
              className={cn(
                'w-full px-[12px] py-[9px] rounded-[10px] border text-[13px] outline-none transition-all duration-[180ms]',
                dark
                  ? 'bg-[#1E293B] border-[#334155] text-[#E2E8F0]'
                  : 'bg-white border-[#E2E8F0] text-[#0D1B2A]'
              )}
            >
              <option value="">Select encounter type</option>
              {ENCOUNTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={cn(
              'block text-[12px] font-semibold mb-2',
              dark ? 'text-[#E2E8F0]' : 'text-[#0D1B2A]'
            )}>
              Note Style Preset
            </label>
            <select
              value={activePreset}
              onChange={(e) => {
                const value = e.target.value as NoteStylePreset
                setStyleOverridePreset(value === savedPreset ? null : value)
              }}
              className={cn(
                'w-full px-[12px] py-[9px] rounded-[10px] border text-[13px] outline-none transition-all duration-[180ms]',
                dark
                  ? 'bg-[#1E293B] border-[#334155] text-[#E2E8F0]'
                  : 'bg-white border-[#E2E8F0] text-[#0D1B2A]'
              )}
            >
              {STYLE_PRESET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 text-[12px] text-[#94A3B8]">
          Focus: {savedFocus.replaceAll('_', ' ')} ·
          {' '}Plan bullets: {profile.includeBulletsInPlan ? 'on' : 'off'} ·
          {' '}Patient-friendly language: {profile.includePatientFriendlyLanguage ? 'on' : 'off'}
        </div>
      </div>

      <UploadZone />
      <TranscribeButton />
    </div>
  )
}
