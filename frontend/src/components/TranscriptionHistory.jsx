import { useState } from 'react'
import { Clock, FileAudio, Trash2, ChevronDown, ChevronUp, Eye } from 'lucide-react'

function TranscriptionHistory({ onLoadHistory, darkMode, isLoadingHistory }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [history, setHistory] = useState(() => {
    // Load history from localStorage
    const saved = localStorage.getItem('mediscribe_history')
    return saved ? JSON.parse(saved) : []
  })

  // Format timestamp for display
  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  // Delete individual transcription
  const handleDelete = (id) => {
    const updated = history.filter(item => item.id !== id)
    setHistory(updated)
    localStorage.setItem('mediscribe_history', JSON.stringify(updated))
  }

  // Clear all history
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all transcription history?')) {
      setHistory([])
      localStorage.removeItem('mediscribe_history')
    }
  }

  // Load a past transcription
  const handleView = (item) => {
    console.log('Viewing history item:', item)
    
    // Verify the item has required data
    if (!item.transcription || !item.entities || !item.soapNote) {
      console.error('History item missing required data:', item)
      alert('This transcription data is incomplete and cannot be loaded.')
      return
    }
    
    onLoadHistory(item)
    
    // Don't scroll immediately - let the parent component handle it
    // The parent will scroll after setting state
  }

  if (history.length === 0) {
    return null // Don't show component if no history
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <Clock className="w-5 h-5" />
          <span>Recent Transcriptions ({history.length})</span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {isExpanded && history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* History List */}
      {isExpanded && (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4 hover:border-blue-300 dark:hover:border-blue-500 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <FileAudio className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                      {item.filename}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Date:</span> {formatDate(item.timestamp)}
                    </div>
                    <div>
                      <span className="font-medium">Size:</span> {formatFileSize(item.fileSize)}
                    </div>
                    <div>
                      <span className="font-medium">Entities:</span> {item.entityCount || 0}
                    </div>
                    <div>
                      <span className="font-medium">Time:</span> {item.processingTime?.toFixed(1) || '?'}s
                    </div>
                  </div>

                  {item.confidence !== null && item.confidence !== undefined && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Confidence:</span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 max-w-32">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              item.confidence >= 80
                                ? 'bg-green-500'
                                : item.confidence >= 60
                                ? 'bg-yellow-500'
                                : 'bg-orange-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, item.confidence))}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {Math.round(item.confidence)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleView(item)}
                    disabled={isLoadingHistory}
                    className={`flex items-center gap-1 ${isLoadingHistory ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'} text-white px-3 py-1.5 rounded text-xs transition-colors`}
                    title="View this transcription"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={isLoadingHistory}
                    className={`flex items-center gap-1 ${isLoadingHistory ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'} text-white px-3 py-1.5 rounded text-xs transition-colors`}
                    title="Delete this transcription"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collapsed Summary */}
      {!isExpanded && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Click to view your {history.length} recent transcription{history.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}

export default TranscriptionHistory