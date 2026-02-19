import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  Play,
  Pause
} from 'lucide-react'
import { cn, formatFileSize, formatDuration } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const ACCEPTED_AUDIO_FORMATS = ['.mp3', '.wav', '.m4a', '.webm', '.ogg', '.flac']
const MAX_FILE_SIZE_MB = 25

export function FileUploadZone({
  onFileSelect,
  onFileRemove,
  acceptedFormats = ACCEPTED_AUDIO_FORMATS,
  maxFileSize = MAX_FILE_SIZE_MB,
  className,
  disabled = false
}) {
  const [uploadState, setUploadState] = useState('idle')
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioDuration, setAudioDuration] = useState(null)
  
  const fileInputRef = useRef(null)
  const audioRef = useRef(null)

  const validateFile = useCallback((file) => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedFormats.includes(extension)) {
      return `Invalid file type. Accepted formats: ${acceptedFormats.join(', ')}`
    }

    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxFileSize) {
      return `File too large. Maximum size: ${maxFileSize}MB`
    }

    return null
  }, [acceptedFormats, maxFileSize])

  const handleFileSelect = useCallback((file) => {
    const validationError = validateFile(file)
    
    if (validationError) {
      setError(validationError)
      setUploadState('error')
      setTimeout(() => {
        setUploadState('idle')
        setError(null)
      }, 3000)
      return
    }

    setSelectedFile(file)
    setUploadState('selected')
    setError(null)

    const url = URL.createObjectURL(file)
    setAudioUrl(url)

    const audio = new Audio(url)
    audio.addEventListener('loadedmetadata', () => {
      setAudioDuration(audio.duration)
    })

    onFileSelect(file)
  }, [validateFile, onFileSelect])

  const handleInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setUploadState('dragover')
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && uploadState === 'dragover') setUploadState('idle')
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (disabled) return

    setUploadState('idle')
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleRemove = () => {
    setSelectedFile(null)
    setUploadState('idle')
    setError(null)
    setAudioUrl(null)
    setAudioDuration(null)
    setIsPlaying(false)
    
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    if (onFileRemove) onFileRemove()
  }

  const togglePlayback = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const renderContent = () => {
    if (uploadState === 'error') {
      return (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-3 text-red-600"
        >
          <AlertCircle className="h-12 w-12" />
          <div className="text-center">
            <p className="font-semibold">Upload Failed</p>
            <p className="text-sm text-red-500">{error}</p>
          </div>
        </motion.div>
      )
    }

    if (uploadState === 'selected' && selectedFile) {
      return (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full space-y-4"
        >
          <div className="flex items-start gap-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
            <FileAudio className="h-10 w-10 text-green-600 flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {selectedFile.name}
              </p>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                <span>{formatFileSize(selectedFile.size)}</span>
                {audioDuration && (
                  <>
                    <span>•</span>
                    <span>{formatDuration(audioDuration)}</span>
                  </>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {audioUrl && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Button
                variant="outline"
                size="sm"
                onClick={togglePlayback}
                className="flex-shrink-0"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-0" id="audio-progress" />
                </div>
              </div>

              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
              />
            </div>
          )}

          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">
              File ready for transcription
            </span>
          </div>
        </motion.div>
      )
    }

    return (
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ 
          scale: uploadState === 'dragover' ? 1.05 : 1,
          transition: { duration: 0.2 }
        }}
        className="flex flex-col items-center gap-4 text-center"
      >
        <motion.div
          animate={{
            y: uploadState === 'dragover' ? -10 : 0,
          }}
          transition={{ duration: 0.2 }}
          className={cn(
            'p-4 rounded-full',
            uploadState === 'dragover' 
              ? 'bg-blue-100' 
              : 'bg-gray-100'
          )}
        >
          <Upload className={cn(
            'h-10 w-10',
            uploadState === 'dragover' 
              ? 'text-blue-600' 
              : 'text-gray-400'
          )} />
        </motion.div>

        <div>
          <p className="text-lg font-semibold text-gray-900">
            {uploadState === 'dragover' 
              ? 'Drop file here' 
              : 'Drop audio file here'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            or{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 font-medium hover:underline"
            >
              browse files
            </button>
          </p>
        </div>

        <div className="text-xs text-gray-400">
          <p>Supported formats: {acceptedFormats.join(', ')}</p>
          <p>Maximum file size: {maxFileSize}MB</p>
        </div>
      </motion.div>
    )
  }

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200',
        uploadState === 'dragover' && 'border-blue-500 border-2 bg-blue-50',
        uploadState === 'error' && 'border-red-500 border-2 bg-red-50',
        uploadState === 'selected' && 'border-green-500 border-2',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="p-8 md:p-12">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>
    </Card>
  )
}