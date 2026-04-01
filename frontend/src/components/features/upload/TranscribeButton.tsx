import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../../store/appStore'
import { fetchHistory, mapHistoryEntryFromApi, transcribeAudio } from '../../../services/api'
import { Mic, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const PROCESSING_STAGES = [
  { progressAt: 0.08, pct: 10, msg: 'Uploading audio file...'                      },
  { progressAt: 0.18, pct: 22, msg: 'Preparing audio for transcription...'         },
  { progressAt: 0.48, pct: 58, msg: 'Running Whisper transcription...'             },
  { progressAt: 0.72, pct: 78, msg: 'Extracting medical entities with scispaCy...' },
  { progressAt: 0.88, pct: 92, msg: 'Generating SOAP note...'                      },
  { progressAt: 0.96, pct: 97, msg: 'Finalising output...'                         },
]

const MIN_AUDIO_DURATION_SECONDS = 45
const SHORT_AUDIO_MESSAGE = 'Recording is too short to process. Please upload a longer clinical audio clip.'

function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds))
  const mins = Math.floor(safe / 60)
  const secs = safe % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

async function getAudioDurationSeconds(file: File): Promise<number | null> {
  return await new Promise((resolve) => {
    const audio = document.createElement('audio')
    const url = URL.createObjectURL(file)
    let settled = false

    audio.preload = 'metadata'
    audio.src = url

    const cleanup = (duration: number | null) => {
      if (settled) return
      settled = true
      audio.onloadedmetadata = null
      audio.onerror = null
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
      resolve(duration)
    }

    audio.onloadedmetadata = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : null
      cleanup(duration)
    }

    audio.onerror = () => {
      cleanup(null)
    }
  })
}

function estimateProcessingSeconds(file: File, audioDurationSeconds: number | null): number {
  // Use a conservative estimate that tracks audio length rather than pretending
  // all uploads finish in a few seconds. For a 3-minute file this targets
  // roughly 2 minutes end-to-end on the local fast path.
  const durationBased = audioDurationSeconds
    ? Math.round(audioDurationSeconds * 0.5 + 30)
    : Math.round((file.size / (1024 * 1024)) * 12 + 30)

  return Math.min(Math.max(durationBased, 25), 180)
}

function ProcessingStatus({ remainingSeconds, elapsedSeconds }: { remainingSeconds: number | null; elapsedSeconds: number }) {
  const status = useAppStore((s) => s.processingStatus)
  return (
    <div className="flex items-center justify-between gap-4 w-full">
      <span className="text-[12.5px] text-[#4A5568] font-medium">
        {status}
      </span>
      <span className="text-[12px] text-[#64748B] font-medium whitespace-nowrap">
        {remainingSeconds !== null && remainingSeconds > 0
          ? `About ${formatDuration(remainingSeconds)} remaining`
          : `Elapsed ${formatDuration(elapsedSeconds)}`}
      </span>
    </div>
  )
}

export default function TranscribeButton() {
  const {
    uploadState, selectedFile,
    setUploadState, setProcessingStatus, setResult,
    setError, addToHistory, setHistory,
  } = useAppStore()

  const progressRef = useRef<HTMLDivElement>(null)
  const stageRef    = useRef<Array<ReturnType<typeof setTimeout>>>([])
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const isSelected   = uploadState === 'selected'
  const isProcessing = uploadState === 'processing'

  // Animate the progress bar through fake stages while API call runs
  const startFakeProgress = (estimatedTotalSeconds: number) => {
    stageRef.current.forEach(clearTimeout)
    stageRef.current = []
    PROCESSING_STAGES.forEach(({ progressAt, pct, msg }) => {
      const t = setTimeout(() => {
        setProcessingStatus(msg)
        if (progressRef.current) {
          progressRef.current.style.width = `${pct}%`
        }
      }, Math.round(progressAt * estimatedTotalSeconds * 1000))
      stageRef.current.push(t)
    })
  }

  const finishProgress = () => {
    stageRef.current.forEach(clearTimeout)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (progressRef.current) progressRef.current.style.width = '100%'
    setRemainingSeconds(0)
  }

  const startTimer = (estimatedTotalSeconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current)

    setElapsedSeconds(0)
    setRemainingSeconds(estimatedTotalSeconds)

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
      setRemainingSeconds((prev) => {
        if (prev === null) return null
        return prev > 0 ? prev - 1 : 0
      })
    }, 1000)
  }

  // Cleanup on unmount
  useEffect(() => () => {
    stageRef.current.forEach(clearTimeout)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const handleTranscribe = async () => {
    if (!selectedFile) return

    const audioDurationSeconds = await getAudioDurationSeconds(selectedFile)
    if (audioDurationSeconds !== null && audioDurationSeconds < MIN_AUDIO_DURATION_SECONDS) {
      setError(SHORT_AUDIO_MESSAGE)
      toast.error('Audio too short', {
        description: SHORT_AUDIO_MESSAGE,
      })
      return
    }
    const estimatedTotalSeconds = estimateProcessingSeconds(selectedFile, audioDurationSeconds)

    setUploadState('processing')
    setProcessingStatus(`Uploading audio file... Estimated time: ${formatDuration(estimatedTotalSeconds)}`)
    startTimer(estimatedTotalSeconds)
    startFakeProgress(estimatedTotalSeconds)

    try {
      const result = await transcribeAudio(selectedFile, audioDurationSeconds)
      finishProgress()

      // Short pause so the bar hits 100% visually before disappearing
      setTimeout(() => {
        // Guard: backend may reject non-medical audio with success: false
        const raw = result as typeof result & { success?: boolean; message?: string }
        if (raw.success === false) {
          setError(raw.message ?? 'Non-medical content detected. Please upload clinical audio only.')
          toast.error('Content validation failed', {
            description: raw.message ?? 'Non-medical content detected.',
          })
          return
        }

        setResult(result)
        void fetchHistory()
          .then((history) => setHistory(history.map(mapHistoryEntryFromApi)))
          .catch(() => addToHistory(result, selectedFile))
        const { notifications } = useAppStore.getState()
        if (notifications.transcriptDone) {
          toast.success('Transcription complete', {
            description: `${result.entities.length} medical entities extracted`,
          })
        }
      }, 400)
    } catch (err) {
      stageRef.current.forEach(clearTimeout)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
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
            <ProcessingStatus remainingSeconds={remainingSeconds} elapsedSeconds={elapsedSeconds} />
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
