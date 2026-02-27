import { useEffect, useRef } from 'react'
import { useAppStore } from '../../../store/appStore'
import { transcribeAudio } from '../../../services/api'
import { Mic, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const PROCESSING_STAGES = [
  { pct: 12, msg: 'Uploading audio file...'                        },
  { pct: 35, msg: 'Running Whisper transcription...'               },
  { pct: 68, msg: 'Extracting medical entities with scispaCy...'   },
  { pct: 88, msg: 'Generating SOAP note...'                        },
  { pct: 97, msg: 'Finalising output...'                           },
]

function ProcessingStatus() {
  const status = useAppStore((s) => s.processingStatus)
  return (
    <span className="text-[12.5px] text-[#4A5568] font-medium">
      {status}
    </span>
  )
}

export default function TranscribeButton() {
  const {
    uploadState, selectedFile,
    setUploadState, setProcessingStatus, setResult,
    setError, addToHistory,
  } = useAppStore()

  const progressRef = useRef<HTMLDivElement>(null)
  const stageRef    = useRef<Array<ReturnType<typeof setTimeout>>>([])

  const isSelected   = uploadState === 'selected'
  const isProcessing = uploadState === 'processing'

  // Animate the progress bar through fake stages while API call runs
  const startFakeProgress = () => {
    stageRef.current.forEach(clearTimeout)
    stageRef.current = []
    PROCESSING_STAGES.forEach(({ pct, msg }, i) => {
      const t = setTimeout(() => {
        setProcessingStatus(msg)
        if (progressRef.current) {
          progressRef.current.style.width = `${pct}%`
        }
      }, i * 900)
      stageRef.current.push(t)
    })
  }

  const finishProgress = () => {
    stageRef.current.forEach(clearTimeout)
    if (progressRef.current) progressRef.current.style.width = '100%'
  }

  // Cleanup on unmount
  useEffect(() => () => stageRef.current.forEach(clearTimeout), [])

  const handleTranscribe = async () => {
    if (!selectedFile) return

    setUploadState('processing')
    setProcessingStatus('Uploading audio file...')
    startFakeProgress()

    try {
      const result = await transcribeAudio(selectedFile)
      finishProgress()

      // Short pause so the bar hits 100% visually before disappearing
      setTimeout(() => {
  setResult(result)
  addToHistory(result, selectedFile)
  const { notifications } = useAppStore.getState()
  if (notifications.transcriptDone) {
    toast.success('Transcription complete', {
      description: `${result.entities.length} medical entities extracted`,
    })
  }
}, 400)
    } catch (err) {
      stageRef.current.forEach(clearTimeout)
      const msg = err instanceof Error ? err.message : 'Transcription failed. Please try again.'
      setError(msg)
      toast.error('Transcription failed', { description: msg })
    }
  }

  if (!isSelected && !isProcessing) return null

  return (
    <div className="mt-5">
      {/* Processing progress bar */}
      {isProcessing && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <ProcessingStatus />
          </div>
          <div className="h-[6px] bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              ref={progressRef}
              className="h-full bg-gradient-to-r from-[#1A56DB] to-[#0BA871] rounded-full"
              style={{ width: '0%', transition: 'width 600ms ease-in-out' }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        {!isProcessing && (
          <button
            onClick={() => useAppStore.getState().clearUpload()}
            className="px-[14px] py-[8px] rounded-[10px] border border-[#E2E8F0] bg-white text-[#4A5568] text-[13px] font-medium hover:border-[#94A3B8] transition-all duration-[180ms]"
          >
            Clear
          </button>
        )}
        <button
          onClick={handleTranscribe}
          disabled={isProcessing}
          className="flex items-center gap-[8px] px-[20px] py-[9px] rounded-[10px] bg-[#1A56DB] text-white text-[13.5px] font-semibold disabled:opacity-70 disabled:cursor-not-allowed hover:bg-[#1648C0] hover:shadow-[0_4px_14px_rgba(26,86,219,0.35)] hover:-translate-y-px transition-all duration-[180ms]"
        >
          {isProcessing
            ? <><Loader2 size={15} className="animate-spin" /> Processing...</>
            : <><Mic size={15} /> Transcribe Audio</>
          }
        </button>
      </div>
    </div>
  )
}
