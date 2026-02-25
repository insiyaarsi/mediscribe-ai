import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../../store/appStore'
import { cn } from '../../../lib/utils'
import { Upload, Music, X, Play, Pause } from 'lucide-react'

const ACCEPTED_FORMATS = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/flac', 'audio/x-flac', 'audio/m4a']
const ACCEPTED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.webm', '.ogg', '.flac']
const MAX_SIZE_MB = 100

export default function UploadZone() {
  const { uploadState, selectedFile, setFile, setError } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  const isSelected   = uploadState === 'selected'
  const isProcessing = uploadState === 'processing'
  const isDone       = uploadState === 'done'

  const validateAndSetFile = (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    const validType = ACCEPTED_FORMATS.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext)
    if (!validType) {
      setError(`Unsupported format. Please upload: ${ACCEPTED_EXTENSIONS.join(', ')}`)
      return
    }
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > MAX_SIZE_MB) {
      setError(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`)
      return
    }
    setFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) validateAndSetFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) validateAndSetFile(file)
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return mb < 1 ? `${Math.round(bytes / 1024)} KB` : `${mb.toFixed(1)} MB`
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  useEffect(() => {
    if (!selectedFile) {
      setAudioUrl(null)
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      return
    }

    const url = URL.createObjectURL(selectedFile)
    setAudioUrl(url)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [selectedFile])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onLoadedMetadata = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      audio.currentTime = 0
    }

    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
    }
  }, [audioUrl])

  const handlePlayPause = async () => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    if (audio.paused) {
      try {
        await audio.play()
        setIsPlaying(true)
      } catch {
        setIsPlaying(false)
      }
      return
    }

    audio.pause()
    setIsPlaying(false)
  }

  // Idle / drag state
  if (!isSelected && !isProcessing && !isDone) {
    return (
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-[14px] p-12 text-center cursor-pointer',
          'transition-all duration-[220ms]',
          isDragOver
            ? 'border-[#1A56DB] bg-[#EBF3FF]'
            : 'border-[#CBD5E0] bg-[#F7FAFC] hover:border-[#1A56DB] hover:bg-[#EBF3FF]'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="w-[52px] h-[52px] rounded-full bg-[#EBF3FF] flex items-center justify-center mx-auto mb-4 text-[#1A56DB]">
          <Upload size={24} />
        </div>
        <div className="font-head text-[15px] font-semibold text-[#0D1B2A] mb-2">
          Drop your audio file here
        </div>
        <div className="text-[13px] text-[#4A5568] mb-4">
          or click to browse from your computer
        </div>
        <div className="flex gap-2 justify-center flex-wrap">
          {ACCEPTED_EXTENSIONS.map(ext => (
            <span key={ext} className="font-mono text-[10px] px-2 py-1 rounded-[4px] bg-white border border-[#E2E8F0] text-[#94A3B8]">
              {ext.replace('.', '').toUpperCase()}
            </span>
          ))}
        </div>
      </div>
    )
  }

  // File selected state
  return (
    <div className="border-2 border-solid border-[#0BA871] rounded-[14px] p-6 bg-[#E6F7F2]">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        onChange={handleFileInput}
        className="hidden"
      />
      <div className="flex items-center gap-4">
        <div className="w-[48px] h-[48px] rounded-[10px] bg-[#E6F7F2] border border-[#0BA871]/30 flex items-center justify-center flex-shrink-0 text-[#0BA871]">
          <Music size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div  style={{color: '#000000'}} className="font-semibold text-[14px] truncate">
            {selectedFile?.name}
          </div>
          <div className="font-mono text-[12px] text-[#94A3B8] mt-1">
            {selectedFile ? formatFileSize(selectedFile.size) : ''} · Audio ready
          </div>
          {/* Fake audio player bar */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handlePlayPause}
              className="w-[26px] h-[26px] rounded-full bg-[#0BA871] text-white flex items-center justify-center flex-shrink-0 hover:bg-[#099660] transition-colors"
            >
              {isPlaying ? <Pause size={10} fill="white" /> : <Play size={10} fill="white" />}
            </button>
            <div className="flex-1 h-[4px] bg-[#CBD5E0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0BA871] rounded-full transition-[width] duration-150"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <span className="font-mono text-[11px] text-[#94A3B8]">{formatTime(currentTime)}</span>
          </div>
          <audio ref={audioRef} src={audioUrl ?? undefined} preload="metadata" className="hidden" />
        </div>
        {/* Remove file button — only when not processing */}
        {!isProcessing && (
          <button
            onClick={() => {
              const audio = audioRef.current
              if (audio) {
                audio.pause()
                audio.currentTime = 0
              }
              setFile(null)
              setIsPlaying(false)
            }}
            className="flex items-center gap-[6px] px-[13px] py-[6px] rounded-[10px] border border-[#E2E8F0] bg-white text-[#4A5568] text-[13px] font-medium hover:border-red-300 hover:text-red-500 transition-all duration-[180ms] flex-shrink-0"
          >
            <X size={13} />
            Remove
          </button>
        )}
      </div>
    </div>
  )
}
