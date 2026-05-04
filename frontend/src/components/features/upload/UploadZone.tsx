import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { useAppStore } from '../../../store/appStore'
import { cn } from '../../../lib/utils'
import { Upload, Music, X, Play, Pause } from 'lucide-react'

const ACCEPTED_FORMATS = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/flac', 'audio/x-flac', 'audio/m4a']
const ACCEPTED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.webm', '.ogg', '.flac']
const MAX_SIZE_MB = 100

export default function UploadZone() {
  const { uploadState, selectedFile, preferences, setFile, setError } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const revokeTimerRef = useRef<number | null>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  const dark         = preferences.darkMode
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

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) validateAndSetFile(file)
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
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
    const audio = audioRef.current

    if (revokeTimerRef.current !== null) {
      window.clearTimeout(revokeTimerRef.current)
      revokeTimerRef.current = null
    }

    if (!selectedFile) {
      if (audio) {
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
      }
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
      const currentAudio = audioRef.current
      if (currentAudio && currentAudio.src === url) {
        currentAudio.pause()
        currentAudio.removeAttribute('src')
        currentAudio.load()
      }
      revokeTimerRef.current = window.setTimeout(() => {
        URL.revokeObjectURL(url)
        revokeTimerRef.current = null
      }, 0)
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

  useEffect(() => () => {
    if (revokeTimerRef.current !== null) {
      window.clearTimeout(revokeTimerRef.current)
    }
  }, [])

  const handlePlayPause = async () => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    if (audio.paused) {
      try { await audio.play(); setIsPlaying(true) } catch { setIsPlaying(false) }
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
            ? dark
              ? 'border-[#1A56DB] bg-[#1E3A5F]'
              : 'border-[#1A56DB] bg-[#EBF3FF]'
            : dark
              ? 'border-[#334155] bg-[#0F172A] hover:border-[#1A56DB] hover:bg-[#1E3A5F]'
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
        <div className={cn(
          'w-[52px] h-[52px] rounded-full flex items-center justify-center mx-auto mb-4 text-[#1A56DB]',
          dark ? 'bg-[#1E3A5F]' : 'bg-[#EBF3FF]'
        )}>
          <Upload size={24} />
        </div>
        <div className={cn(
          'font-head text-[15px] font-semibold mb-2',
          dark ? 'text-[#F1F5F9]' : 'text-[#0D1B2A]'
        )}>
          Drop your audio file here
        </div>
        <div className="text-[13px] text-[#94A3B8] mb-4">
          or click to browse from your computer
        </div>
        <div className="flex gap-2 justify-center flex-wrap">
          {ACCEPTED_EXTENSIONS.map(ext => (
            <span
              key={ext}
              className={cn(
                'font-mono text-[10px] px-2 py-1 rounded-[4px] border text-[#94A3B8]',
                dark ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E2E8F0]'
              )}
            >
              {ext.replace('.', '').toUpperCase()}
            </span>
          ))}
        </div>
      </div>
    )
  }

  // File selected / processing / done state
  return (
    <div className={cn(
      'border-2 border-solid rounded-[14px] p-6',
      dark ? 'border-[#0BA871] bg-[#0D3327]' : 'border-[#0BA871] bg-[#E6F7F2]'
    )}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        onChange={handleFileInput}
        className="hidden"
      />
      <div className="flex items-center gap-4">
        <div className={cn(
          'w-[48px] h-[48px] rounded-[10px] border flex items-center justify-center flex-shrink-0 text-[#0BA871]',
          dark ? 'bg-[#0D3327] border-[#0BA871]/30' : 'bg-[#E6F7F2] border-[#0BA871]/30'
        )}>
          <Music size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={cn(
            'font-semibold text-[14px] truncate',
            dark ? 'text-[#F1F5F9]' : 'text-[#0D1B2A]'
          )}>
            {selectedFile?.name}
          </div>
          <div className="font-mono text-[12px] text-[#94A3B8] mt-1">
            {selectedFile ? formatFileSize(selectedFile.size) : ''} · Audio ready
          </div>
          {/* Audio player bar */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handlePlayPause}
              className="w-[26px] h-[26px] rounded-full bg-[#0BA871] text-white flex items-center justify-center flex-shrink-0 hover:bg-[#099660] transition-colors"
            >
              {isPlaying ? <Pause size={10} fill="white" /> : <Play size={10} fill="white" />}
            </button>
            <div className={cn(
              'flex-1 h-[4px] rounded-full overflow-hidden',
              dark ? 'bg-[#1E293B]' : 'bg-[#CBD5E0]'
            )}>
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
              if (audio) { audio.pause(); audio.currentTime = 0 }
              setFile(null)
              setIsPlaying(false)
            }}
            className={cn(
              'flex items-center gap-[6px] px-[13px] py-[6px] rounded-[10px] border',
              'text-[13px] font-medium flex-shrink-0',
              'hover:border-red-300 hover:text-red-500 transition-all duration-[180ms]',
              dark
                ? 'bg-[#1E293B] border-[#334155] text-[#94A3B8]'
                : 'bg-white border-[#E2E8F0] text-[#4A5568]'
            )}
          >
            <X size={13} />
            Remove
          </button>
        )}
      </div>
    </div>
  )
}
