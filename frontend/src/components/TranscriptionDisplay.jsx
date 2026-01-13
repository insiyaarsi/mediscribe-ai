import { Clock, Music } from 'lucide-react'
import { useEffect, useState } from 'react'

function TranscriptionDisplay({ transcription, processingTime, audioFile }) {
  const [audioUrl, setAudioUrl] = useState(null)

  // Create object URL for audio playback
  useEffect(() => {
    if (audioFile) {
      const url = URL.createObjectURL(audioFile)
      setAudioUrl(url)

      // Cleanup URL when component unmounts
      return () => URL.revokeObjectURL(url)
    }
  }, [audioFile])

  if (!transcription) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">
          Transcription
        </h2>
        <div className="flex items-center gap-3 sm:gap-4">
          {processingTime && (
            <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4 mr-1" />
              <span>{processingTime.toFixed(2)}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Audio Player */}
      {audioUrl && (
        <div className="mb-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 sm:p-4 transition-colors">
          <div className="flex items-center mb-2">
            <Music className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-2" />
            <span className="text-xs sm:text-sm font-semibold text-indigo-900 dark:text-indigo-300">
              Audio Recording
            </span>
          </div>
          <audio 
            controls 
            className="w-full h-8 sm:h-10"
            style={{ outline: 'none' }}
          >
            <source src={audioUrl} />
            Your browser does not support audio playback.
          </audio>
        </div>
      )}

      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 sm:p-4 transition-colors">
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
          {transcription}
        </p>
      </div>
    </div>
  )
}

export default TranscriptionDisplay