import { useState } from 'react'
import { Upload, FileAudio, Loader2 } from 'lucide-react'

function FileUpload({ onTranscribe, isLoading }) {
  const [selectedFile, setSelectedFile] = useState(null)

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/flac']
      const validExtensions = ['.mp3', '.wav', '.m4a', '.webm', '.ogg', '.flac']
      
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
      
      if (validTypes.includes(file.type) || validExtensions.includes(fileExtension)) {
        setSelectedFile(file)
      } else {
        alert('Please select a valid audio file (MP3, WAV, M4A, WebM, OGG, or FLAC)')
      }
    }
  }

  const handleTranscribeClick = () => {
    if (selectedFile && !isLoading) {
      onTranscribe(selectedFile)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300">
      <div className="space-y-4">
        {/* File Input Section */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 sm:p-8 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
          <label htmlFor="audio-upload" className="cursor-pointer">
            <div className="flex flex-col items-center">
              {selectedFile ? (
                <>
                  <FileAudio className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-600 dark:text-indigo-400 mb-3 sm:mb-4" />
                  <p className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Click to change file
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500 mb-3 sm:mb-4" />
                  <p className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    Upload Audio File
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    MP3, WAV, M4A, WebM, OGG, or FLAC
                  </p>
                </>
              )}
            </div>
          </label>
          <input
            id="audio-upload"
            type="file"
            accept=".mp3,.wav,.m4a,.webm,.ogg,.flac,audio/*"
            onChange={handleFileChange}
            disabled={isLoading}
            className="hidden"
          />
        </div>

        {/* Transcribe Button */}
        <button
          onClick={handleTranscribeClick}
          disabled={!selectedFile || isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 sm:py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center text-sm sm:text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            'Transcribe & Analyze'
          )}
        </button>
      </div>
    </div>
  )
}

export default FileUpload