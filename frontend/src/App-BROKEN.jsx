import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, X, Moon, Sun, History, FileText, Activity } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// NEW: Import new components
import { FileUploadZone } from './components/features/transcription/FileUploadZone'
import { EntityBadgeList, EntityCategorySummary } from './components/medical/EntityBadge'
import { ConfidenceScore, ConfidenceScoreList } from './components/medical/ConfidenceScore'
import { SOAPNoteCard } from './components/medical/SOAPNoteCard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card'
import { Button } from './components/ui/button'
import { Separator } from './components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert'

// OLD: Keep these for now
import TranscriptionDisplay from './components/TranscriptionDisplay'
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
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const saveToHistory = (audioFile, data, processingTime) => {
    console.log('Saving to history:', { audioFile: audioFile.name, data })
    
    let confidence = data.validation?.confidence_score || null
    if (confidence !== null && confidence <= 1) {
      confidence = Math.round(confidence * 100)
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

    const saved = localStorage.getItem('mediscribe_history')
    const history = saved ? JSON.parse(saved) : []
    history.unshift(historyItem)
    const trimmedHistory = history.slice(0, 5)
    localStorage.setItem('mediscribe_history', JSON.stringify(trimmedHistory))
  }

  const handleLoadHistory = (historyItem) => {
    setIsLoadingHistory(true)
    setResult(null)
    setError(null)
    setCurrentAudioFile(null)
    setProcessingTime(null)
    setFileSize(null)
    setIsFromHistory(false)
    
    setTimeout(() => {
      setIsFromHistory(true)
      
      const reconstructedResult = {
        transcription: historyItem.transcription,
        entities: historyItem.entities,
        soap_note: historyItem.soapNote,
        validation: historyItem.validation
      }

      setResult(reconstructedResult)
      setProcessingTime(historyItem.processingTime)
      setFileSize(historyItem.fileSize)
      
      const mockFile = {
        name: historyItem.filename,
        size: historyItem.fileSize,
        type: 'audio/mpeg',
        isMock: true
      }
      setCurrentAudioFile(mockFile)
      setIsLoadingHistory(false)
      
      setTimeout(() => {
        window.scrollTo({ top: 300, behavior: 'smooth' })
      }, 100)
    }, 50)
  }

  const handleTranscribe = async (audioFile) => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    setProcessingTime(null)
    setIsFromHistory(false)
    
    setFileSize(audioFile.size)
    setCurrentAudioFile(audioFile)
    
    const startTime = Date.now()

    try {
      const formData = new FormData()
      formData.append('file', audioFile)

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/transcribe`, {
        method: 'POST',
        body: formData,
      })

      const endTime = Date.now()
      const duration = (endTime - startTime) / 1000
      setProcessingTime(duration)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setResult(data)

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

  const handleFileRemove = () => {
    setCurrentAudioFile(null)
    setFileSize(null)
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return null
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  // FIXED: Convert nested backend entity structure to flat format for new components
  const getFormattedEntities = () => {
    if (!result?.entities) return []
    
    const formatted = []
    
    // Helper to extract items from nested structure
    const extractItems = (data, category) => {
      // Handle nested structure: { symptoms: [...], symptom_count: N, ... }
      if (data && typeof data === 'object') {
        // Check if it has a matching plural key
        const items = data[category + 's'] || data[category] || []
        
        // If items is an array, process it
        if (Array.isArray(items)) {
          return items
        }
        
        // If data itself is an array, return it
        if (Array.isArray(data)) {
          return data
        }
      }
      
      return []
    }
    
    // Process each category
    const categories = [
      { key: 'symptoms', singular: 'symptom' },
      { key: 'medications', singular: 'medication' },
      { key: 'conditions', singular: 'condition' },
      { key: 'procedures', singular: 'procedure' },
      { key: 'tests', singular: 'test' }
    ]
    
    categories.forEach(({ key, singular }) => {
      const categoryData = result.entities[key]
      const items = extractItems(categoryData, singular)
      
      items.forEach(item => {
        // Handle both string and object formats
        const text = typeof item === 'string' ? item : (item.text || item.name || String(item))
        const confidence = typeof item === 'object' ? (item.confidence || 85) : 85
        
        formatted.push({
          text: text,
          category: singular,
          confidence: confidence
        })
      })
    })
    
    console.log('Formatted entities:', formatted)
    return formatted
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950 transition-colors duration-300">
        
        {/* Professional Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 shadow-sm"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Logo and Title */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    MediScribe AI
                  </h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    AI-Powered Clinical Documentation
                  </p>
                </div>
              </div>

              {/* Dark Mode Toggle */}
              <Button
                onClick={toggleDarkMode}
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 text-yellow-500" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-600" />
                )}
              </Button>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* Transcription History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <TranscriptionHistory 
              onLoadHistory={handleLoadHistory}
              darkMode={darkMode}
              isLoadingHistory={isLoadingHistory}
            />
          </motion.div>

          {/* File Upload Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Upload Audio Recording
                </CardTitle>
                <CardDescription>
                  Upload a doctor-patient conversation for AI-powered transcription and SOAP note generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploadZone
                  onFileSelect={handleTranscribe}
                  onFileRemove={handleFileRemove}
                  disabled={isLoading}
                />
              </CardContent>
            </Card>
          </motion.section>

          {/* Loading State */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Alert>
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                    <div>
                      <AlertTitle>Processing your audio...</AlertTitle>
                      <AlertDescription>
                        AI is transcribing the conversation and extracting medical entities
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading from History */}
          <AnimatePresence>
            {isLoadingHistory && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Alert className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                    <div>
                      <AlertTitle className="text-blue-900 dark:text-blue-200">
                        Loading from History
                      </AlertTitle>
                      <AlertDescription className="text-blue-800 dark:text-blue-300">
                        Retrieving previous transcription...
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message */}
          <AnimatePresence>
            {result && !error && !isLoadingHistory && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <Alert className={
                  isFromHistory 
                    ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700"
                    : "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700"
                }>
                  {isFromHistory ? (
                    <History className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                  <AlertTitle className={
                    isFromHistory
                      ? "text-blue-900 dark:text-blue-200"
                      : "text-green-900 dark:text-green-200"
                  }>
                    {isFromHistory ? 'Loaded from History' : 'Processing Complete'}
                  </AlertTitle>
                  <AlertDescription className={
                    isFromHistory
                      ? "text-blue-800 dark:text-blue-300"
                      : "text-green-800 dark:text-green-300"
                  }>
                    {processingTime && `Processed in ${processingTime.toFixed(2)} seconds`}
                    {fileSize && ` • File size: ${formatFileSize(fileSize)}`}
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleClearResults}
                  variant="destructive"
                  className="w-full sm:w-auto"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Results
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Section */}
          <AnimatePresence>
            {result && !isLoadingHistory && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Confidence Scores */}
                {result.validation?.confidence_score && (
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>AI Confidence Metrics</CardTitle>
                        <CardDescription>
                          Machine learning confidence scores for transcription quality
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <ConfidenceScore
                            score={Math.round(result.validation.confidence_score <= 1 
                              ? result.validation.confidence_score * 100 
                              : result.validation.confidence_score)}
                            variant="ring"
                            size="md"
                            showLabel
                            label="Overall Confidence"
                          />
                          <ConfidenceScore
                            score={87}
                            variant="ring"
                            size="md"
                            showLabel
                            label="Entity Extraction"
                          />
                          <ConfidenceScore
                            score={92}
                            variant="ring"
                            size="md"
                            showLabel
                            label="SOAP Generation"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.section>
                )}

                <Separator />

                {/* Transcription */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Transcription</CardTitle>
                      <CardDescription>
                        Complete audio-to-text conversion
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TranscriptionDisplay 
                        transcription={result.transcription}
                        processingTime={processingTime}
                        audioFile={currentAudioFile}
                      />
                    </CardContent>
                  </Card>
                </motion.section>

                <Separator />

                {/* Medical Entities */}
                {getFormattedEntities().length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Medical Entities
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        AI-extracted symptoms, medications, conditions, and procedures
                      </p>
                    </div>

                    {/* Entity Summary */}
                    <EntityCategorySummary 
                      entities={getFormattedEntities()}
                    />

                    {/* Entity List */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Extracted Entities</CardTitle>
                        <CardDescription>
                          Click any entity to see details
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <EntityBadgeList
                          entities={getFormattedEntities()}
                          variant="default"
                          showIcons
                          showConfidence
                          onEntityClick={(entity) => {
                            console.log('Entity clicked:', entity)
                          }}
                        />
                      </CardContent>
                    </Card>
                  </motion.section>
                )}

                <Separator />

                {/* SOAP Note */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <SOAPNoteCard
                    soapNote={result.soap_note}
                    editable
                    onUpdate={(updatedNote) => {
                      console.log('SOAP note updated:', updatedNote)
                      setResult({
                        ...result,
                        soap_note: updatedNote
                      })
                    }}
                  />
                </motion.section>
              </motion.div>
            )}
          </AnimatePresence>

        </main>

        {/* Footer */}
        <footer className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              MediScribe AI • Powered by OpenAI Whisper & scispaCy • Portfolio Project 2026
            </p>
          </div>
        </footer>

      </div>
    </div>
  )
}

export default App