import { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
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

      // Transform backend response to match component expectations
      const transformedResult = {
        transcription: data.transcription,
        entities: {
          total: data.entities?.total_entities || 0,
          breakdown: data.entities?.category_counts || {},
          categorized: data.entities?.categorized || {},
        },
        soap_note: data.soap_note,
      };

      setResult(transformedResult);
    } catch (err) {
      console.error('Transcription error:', err);
      setError(err.message || 'An error occurred during transcription');
    } finally {
      setIsLoading(false);
    }
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

        {/* Success Message */}
        {result && !error && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-8 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-800">Success!</h3>
              <p className="text-green-700">
                Audio transcribed and analyzed successfully
              </p>
            </div>
          </div>
        )}

        {/* Results Display - Only show if we have results */}
        {result && (
          <>
            {/* Transcription */}
            <TranscriptionDisplay transcription={result.transcription} />

            {/* Medical Entities */}
            <EntityList entities={result.entities} />

            {/* SOAP Note */}
            <SOAPNoteView soapNote={result.soap_note} />
          </>
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