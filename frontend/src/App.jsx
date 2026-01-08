import { useState } from 'react';
import { CheckCircle, AlertCircle, X, AlertTriangle } from 'lucide-react';
import FileUpload from './components/FileUpload';
import TranscriptionDisplay from './components/TranscriptionDisplay';
import EntityList from './components/EntityList';
import SOAPNoteView from './components/SOAPNoteView';

/**
 * Main App Component
 * Orchestrates the medical transcription workflow
 * Manages state and API communication
 */
function App() {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Handle transcription process
   * Sends audio file to backend API and processes response
   */
  const handleTranscribe = async (audioFile) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Prepare form data with audio file
      const formData = new FormData();
      formData.append('file', audioFile);

      // Call backend API
      const response = await fetch('http://localhost:8000/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Store the complete response (includes validation info)
      setResult(data);
    } catch (err) {
      console.error('Transcription error:', err);
      setError(err.message || 'An error occurred during transcription');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear all results and reset to initial state
   */
  const handleClearResults = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            MediScribe AI
          </h1>
          <p className="text-lg text-gray-600">
            Medical Transcription & Clinical Documentation System
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Powered by OpenAI Whisper & Medical NLP
          </p>
        </div>

        {/* File Upload Section */}
        <FileUpload onTranscribe={handleTranscribe} isLoading={isLoading} />

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Validation Failed Message (Yellow Warning) */}
        {result && !result.success && result.validation && (
          <div className="mt-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-8 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">
                      Validation Failed
                    </h3>
                    <p className="text-yellow-700 mt-1">
                      {result.validation.reason}
                    </p>
                    <div className="mt-3 text-sm text-yellow-600 space-y-1">
                      <p>
                        <span className="font-medium">Medical term density:</span>{' '}
                        {(result.validation.details.medical_term_density * 100).toFixed(1)}%
                        {' '}(minimum required: 10%)
                      </p>
                      <p>
                        <span className="font-medium">Clinical markers found:</span>{' '}
                        {result.validation.details.clinical_markers_found}
                        {' '}(minimum required: 2)
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleClearResults}
                  className="flex-shrink-0 ml-4 text-yellow-500 hover:text-yellow-700 transition-colors"
                  aria-label="Clear results"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Show transcription even on validation failure */}
            <TranscriptionDisplay transcription={result.transcription} />
          </div>
        )}

        {/* Success - Valid Medical Content (Green Message) */}
        {result && result.success && (
          <div className="mt-6 space-y-6">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-800">Success!</h3>
                    <p className="text-green-700 mt-1">
                      Medical content validated and analyzed successfully
                    </p>
                    {result.validation && (
                      <p className="text-sm text-green-600 mt-1">
                        Confidence: {(result.validation.confidence_score * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                </div>
                {/* Clear Results Button */}
                <button
                  onClick={handleClearResults}
                  className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear Results
                </button>
              </div>
            </div>

            {/* Transcription */}
            <TranscriptionDisplay transcription={result.transcription} />

            {/* Medical Entities */}
            <EntityList entities={result.entities} />

            {/* SOAP Note */}
            <SOAPNoteView soapNote={result.soap_note} />
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>MediScribe AI - Educational Portfolio Project</p>
          <p className="mt-1">Built with FastAPI, Whisper, scispacy, React & Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
}

export default App;