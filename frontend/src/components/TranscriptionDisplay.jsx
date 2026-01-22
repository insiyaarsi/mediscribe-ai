import { useEffect, useState } from 'react'
import { FileAudio, Clock } from 'lucide-react'

function TranscriptionDisplay({ transcription, processingTime, audioFile }) {
  const [audioUrl, setAudioUrl] = useState(null)

  useEffect(() => {
    // Only create object URL if we have a real File object (not a mock)
    if (audioFile && audioFile instanceof File) {
      const url = URL.createObjectURL(audioFile)
      setAudioUrl(url)

      // Cleanup
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      // If it's a mock file (from history), clear the audio URL
      setAudioUrl(null)
    }
  }, [audioFile])

  if (!transcription) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">
          Transcription
        </h2>
        {processingTime && (
          <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4 mr-1" />
            <span>{processingTime.toFixed(2)}s</span>
          </div>
        )}
      </div>

      {/* Audio Player - Only show if we have a real file */}
      {audioUrl && (
        <div className="mb-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <FileAudio className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {audioFile?.name || 'Audio File'}
            </span>
          </div>
          <audio 
            controls 
            className="w-full"
            style={{ height: '40px' }}
          >
            <source src={audioUrl} type={audioFile?.type || 'audio/mpeg'} />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {/* Show filename only for history items (no audio player) */}
      {!audioUrl && audioFile && (
        <div className="mb-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <FileAudio className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {audioFile.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              (From history - audio playback not available)
            </span>
          </div>
        </div>
      )}

      {/* Transcription Text */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
          {transcription}
        </p>
      </div>
    </div>
  )
}

export default TranscriptionDisplay