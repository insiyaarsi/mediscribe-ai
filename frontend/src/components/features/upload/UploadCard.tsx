import UploadZone from './UploadZone'
import TranscribeButton from './TranscribeButton'
import { useAppStore } from '../../../store/appStore'
import { AlertCircle } from 'lucide-react'
import { cn } from '../../../lib/utils'

export default function UploadCard() {
  const { errorMessage, uploadState, preferences } = useAppStore()
  const isDone = uploadState === 'done'
  const dark   = preferences.darkMode

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

      <UploadZone />
      <TranscribeButton />
    </div>
  )
}