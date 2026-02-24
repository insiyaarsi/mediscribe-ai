import UploadZone from './UploadZone'
import TranscribeButton from './TranscribeButton'
import { useAppStore } from '../../../store/appStore'
import { AlertCircle } from 'lucide-react'

export default function UploadCard() {
  const { errorMessage, uploadState } = useAppStore()
  const isDone = uploadState === 'done'

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[14px] p-7 mb-6">
      <div className="mb-5">
        <h2 className="font-head text-[14.5px] font-semibold text-[#0D1B2A]">
          Audio Transcription
        </h2>
        <p className="text-[12.5px] text-[#94A3B8] mt-1">
          Upload a doctor–patient conversation to generate a structured SOAP note
        </p>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="flex items-start gap-3 p-4 mb-4 rounded-[10px] bg-red-50 border border-red-200 text-red-700 text-[13px]">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success banner */}
      {isDone && (
        <div className="flex items-center gap-3 p-4 mb-4 rounded-[10px] bg-[#E6F7F2] border border-[#0BA871]/30 text-[#065F46] text-[13px] font-medium">
          ✓ Transcription complete — results displayed below
        </div>
      )}

      <UploadZone />
      <TranscribeButton />
    </div>
  )
}