import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, X, Moon, Sun, History } from 'lucide-react'
import FileUpload from './components/FileUpload'
import TranscriptionDisplay from './components/TranscriptionDisplay'
import EntityList from './components/EntityList'
import SOAPNoteView from './components/SOAPNoteView'
import ConfidenceBar from './components/ConfidenceBar'
import TranscriptionHistory from './components/TranscriptionHistory'

function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [processingTime, setProcessingTime] = useState(null)
  const [fileSize, setFileSize] = useState(null)
  const [currentAudioFile, setCurrentAudioFile] = useState(null)
  const [isFromHistory, setIsFromHistory] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage or default to false
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  // Update localStorage when dark mode changes
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    // Update document class for Tailwind dark mode
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  // Save transcription to history
  const saveToHistory = (audioFile, data, processingTime) => {
    console.log('Saving to history:', { audioFile: audioFile.name, data })
    console.log('Validation data:', data.validation)
    console.log('Raw confidence score:', data.validation?.confidence_score)
    
    // Convert confidence to percentage if it's a decimal (0-1 range)
    let confidence = data.validation?.confidence_score || null
    if (confidence !== null && confidence <= 1) {
      // Backend sent decimal (0.85), convert to percentage (85)
      confidence = Math.round(confidence * 100)
      console.log('Converted confidence to percentage:', confidence)
    }
    
    const historyItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filename: audioFile.name,
      timestamp: new Date().toISOString(),
      fileSize: audioFile.size,
      processingTime: processingTime,
      entityCount: data.entities?.total || 0,
      confidence: confidence,
      transcription: data.transcription,
      entities: data.entities,
      soapNote: data.soap_note,
      validation: data.validation
    }

    console.log('History item confidence (saved):', historyItem.confidence)

    // Get existing history
    const saved = localStorage.getItem('mediscribe_history')
    const history = saved ? JSON.parse(saved) : []

    // Add new item at the beginning
    history.unshift(historyItem)

    // Keep only last 5 items
    const trimmedHistory = history.slice(0, 5)

    // Save back to localStorage
    localStorage.setItem('mediscribe_history', JSON.stringify(trimmedHistory))
    
    console.log('History saved. Total items:', trimmedHistory.length)
  }

  // Load transcription from history
  const handleLoadHistory = (historyItem) => {
    console.log('Loading history item:', historyItem)
    
    // Show loading state
    setIsLoadingHistory(true)
    
    // Clear any existing results first
    setResult(null)
    setError(null)
    setCurrentAudioFile(null)
    setProcessingTime(null)
    setFileSize(null)
    setIsFromHistory(false)
    
    // Use setTimeout to ensure React has time to clear the UI before loading new data
    // This prevents issues when switching between history items
    setTimeout(() => {
      // Set the flag before loading data
      setIsFromHistory(true)
      
      // Reconstruct result object from history
      const reconstructedResult = {
        transcription: historyItem.transcription,
        entities: historyItem.entities,
        soap_note: historyItem.soapNote,
        validation: historyItem.validation
      }

      console.log('Reconstructed result:', reconstructedResult)

      // Set all state at once
      setResult(reconstructedResult)
      setProcessingTime(historyItem.processingTime)
      setFileSize(historyItem.fileSize)
      
      // Create a simple mock file object for display purposes
      // This is NOT a real File, just metadata for display
      const mockFile = {
        name: historyItem.filename,
        size: historyItem.fileSize,
        type: 'audio/mpeg',
        // Add a flag to indicate this is a mock
        isMock: true
      }
      setCurrentAudioFile(mockFile)
      
      // Clear loading state
      setIsLoadingHistory(false)
      
      // Scroll to results after data is set
      setTimeout(() => {
        window.scrollTo({ top: 300, behavior: 'smooth' })
      }, 100)
    }, 50) // 50ms delay to allow React to re-render
  }

  const handleTranscribe = async (audioFile) => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    setProcessingTime(null)
    setIsFromHistory(false)
    
    // Store file size and audio file for display
    setFileSize(audioFile.size)
    setCurrentAudioFile(audioFile)
    
    // Start timer
    const startTime = Date.now()

    try {
      const formData = new FormData()
      formData.append('file', audioFile)

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/transcribe`, {
        method: 'POST',
        body: formData,
      })

      // Calculate processing time
      const endTime = Date.now()
      const duration = (endTime - startTime) / 1000 // Convert to seconds
      setProcessingTime(duration)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setResult(data)

      // Save to history
      saveToHistory(audioFile, data, duration)
    } catch (err) {
      setError(err.message || 'An error occurred during transcription')
      console.error('Transcription error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearResults = () => {
    setResult(null)
    setError(null)
    setProcessingTime(null)
    setFileSize(null)
    setCurrentAudioFile(null)
    setIsFromHistory(false)
    setIsLoadingHistory(false)
  }

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (!bytes) return null
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 py-4 sm:py-8 px-3 sm:px-4 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          {/* Header with Dark Mode Toggle */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center mb-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-2">
                MediScribe AI
              </h1>
              <button
                onClick={toggleDarkMode}
                className="ml-4 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-indigo-600" />
                )}
              </button>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Medical Transcription & Clinical Documentation
            </p>
          </div>

          {/* Transcription History */}
          <TranscriptionHistory 
            onLoadHistory={handleLoadHistory}
            darkMode={darkMode}
            isLoadingHistory={isLoadingHistory}
          />

          {/* Upload Section */}
          <FileUpload 
            onTranscribe={handleTranscribe} 
            isLoading={isLoading}
          />

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start fade-in">
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-red-800 dark:text-red-300 font-semibold">Error</h3>
                <p className="text-red-700 dark:text-red-400 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message with Processing Stats */}
          {isLoadingHistory && (
            <div className="mt-4 sm:mt-6 fade-in">
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3 sm:p-4">
                <div className="flex items-start">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-blue-900 dark:text-blue-200 font-semibold text-sm sm:text-base">
                      Loading from History...
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          )}

          {result && !error && !isLoadingHistory && (
            <div className="mt-4 sm:mt-6 fade-in space-y-4">
              {/* Success Message */}
              <div className={`${isFromHistory ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700' : 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700'} border rounded-lg p-3 sm:p-4`}>
                <div className="flex items-start">
                  {isFromHistory ? (
                    <History className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className={`${isFromHistory ? 'text-blue-900 dark:text-blue-200' : 'text-green-900 dark:text-green-200'} font-semibold text-sm sm:text-base`}>
                      {isFromHistory ? 'Loaded from History' : 'Processing Complete'}
                    </h3>
                    <div className={`${isFromHistory ? 'text-blue-800 dark:text-blue-300' : 'text-green-800 dark:text-green-300'} text-xs sm:text-sm mt-1 space-y-1`}>
                      {processingTime && (
                        <p>Processed in {processingTime.toFixed(2)} seconds</p>
                      )}
                      {fileSize && (
                        <p>File size: {formatFileSize(fileSize)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Confidence Bar */}
              {result.validation && result.validation.confidence_score && (
                <ConfidenceBar score={result.validation.confidence_score} darkMode={darkMode} />
              )}

              {/* Clear Results Button */}
              <button
                onClick={handleClearResults}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <X className="w-5 h-5" />
                Clear Results
              </button>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6 fade-in">
              {/* Transcription */}
              <TranscriptionDisplay 
                transcription={result.transcription}
                processingTime={processingTime}
                audioFile={currentAudioFile}
              />

              {/* Medical Entities */}
              <EntityList entities={result.entities} />

              {/* SOAP Note */}
              <SOAPNoteView soapNote={result.soap_note} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App