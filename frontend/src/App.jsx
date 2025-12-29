import { useState } from 'react';
import { Upload, FileAudio, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

function App() {
  // State management - this is our app's memory
  const [audioFile, setAudioFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/webm', 'audio/ogg', 'audio/flac'];
      if (validTypes.includes(file.type) || file.name.match(/\.(mp3|wav|m4a|webm|ogg|flac)$/i)) {
        setAudioFile(file);
        setError(null);
      } else {
        setError('Please select a valid audio file (MP3, WAV, M4A, WebM, OGG, or FLAC)');
        setAudioFile(null);
      }
    }
  };

  // Handle transcription
  const handleTranscribe = async () => {
    if (!audioFile) {
      setError('Please select an audio file first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', audioFile);

      // Call your backend API
      const response = await fetch('http://localhost:8000/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to process audio. Make sure your backend server is running.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      symptoms: 'bg-red-100 text-red-800 border-red-300',
      medications: 'bg-blue-100 text-blue-800 border-blue-300',
      conditions: 'bg-purple-100 text-purple-800 border-purple-300',
      procedures: 'bg-green-100 text-green-800 border-green-300',
      clinical_terms: 'bg-gray-100 text-gray-800 border-gray-300',
      diagnostic_tests: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      unknown: 'bg-orange-100 text-orange-800 border-orange-300'
    };
    return colors[category] || colors.unknown;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MediScribe AI</h1>
          <p className="text-gray-600">AI-Powered Medical Transcription System</p>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="mb-4">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {audioFile ? (
                  <>
                    <FileAudio className="w-10 h-10 text-indigo-500 mb-2" />
                    <p className="text-sm text-gray-600">{audioFile.name}</p>
                    <p className="text-xs text-gray-400">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Click to upload audio file</p>
                    <p className="text-xs text-gray-400">MP3, WAV, M4A, WebM, OGG, or FLAC</p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept=".mp3,.wav,.m4a,.webm,.ogg,.flac,audio/*"
                onChange={handleFileChange}
              />
            </label>
          </div>

          <button
            onClick={handleTranscribe}
            disabled={!audioFile || isLoading}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Audio...
              </>
            ) : (
              'Transcribe & Analyze'
            )}
          </button>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Results Display */}
        {result && (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-700 font-medium">Audio processed successfully!</p>
            </div>

            {/* Transcription */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Transcription</h2>
              <p className="text-gray-700 leading-relaxed">{result.transcription}</p>
            </div>

            {/* Medical Entities */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Medical Entities Detected</h2>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-gray-900">{result.entities.total}</p>
                  <p className="text-sm text-gray-600">Total Entities</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-red-600">{result.entities.breakdown.symptoms}</p>
                  <p className="text-sm text-gray-600">Symptoms</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-purple-600">{result.entities.breakdown.conditions}</p>
                  <p className="text-sm text-gray-600">Conditions</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-blue-600">{result.entities.breakdown.medications}</p>
                  <p className="text-sm text-gray-600">Medications</p>
                </div>
              </div>

              {/* Categorized Entities */}
              <div className="space-y-4">
                {Object.entries(result.entities.categorized).map(([category, entities]) => {
                  if (entities.length === 0) return null;
                  
                  return (
                    <div key={category}>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 capitalize">
                        {category.replace('_', ' ')} ({entities.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {entities.map((entity, index) => (
                          <span
                            key={index}
                            className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(category)}`}
                          >
                            {entity.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SOAP Note */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">SOAP Note</h2>
              
              {/* Subjective */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-indigo-700 mb-2">Subjective</h3>
                <div className="bg-indigo-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Chief Complaint:</p>
                  <p className="text-gray-800 mb-3">{result.soap_note.subjective.chief_complaint}</p>
                  
                  {result.soap_note.subjective.symptoms.length > 0 && (
                    <>
                      <p className="text-sm font-medium text-gray-700 mb-1">Symptoms:</p>
                      <ul className="list-disc list-inside text-gray-800 space-y-1">
                        {result.soap_note.subjective.symptoms.map((symptom, index) => (
                          <li key={index}>{symptom}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>

              {/* Objective */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-green-700 mb-2">Objective</h3>
                <div className="bg-green-50 rounded-lg p-4">
                  {result.soap_note.objective.findings.map((finding, index) => (
                    <p key={index} className="text-gray-800">{finding}</p>
                  ))}
                </div>
              </div>

              {/* Assessment */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-purple-700 mb-2">Assessment</h3>
                <div className="bg-purple-50 rounded-lg p-4">
                  {result.soap_note.assessment.primary_diagnosis && (
                    <>
                      <p className="text-sm font-medium text-gray-700 mb-1">Primary Diagnosis:</p>
                      <p className="text-gray-800 mb-3">{result.soap_note.assessment.primary_diagnosis}</p>
                    </>
                  )}
                  
                  {result.soap_note.assessment.all_conditions.length > 0 && (
                    <>
                      <p className="text-sm font-medium text-gray-700 mb-1">All Conditions:</p>
                      <ul className="list-disc list-inside text-gray-800 space-y-1">
                        {result.soap_note.assessment.all_conditions.map((condition, index) => (
                          <li key={index}>{condition}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>

              {/* Plan */}
              <div>
                <h3 className="text-xl font-semibold text-blue-700 mb-2">Plan</h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  {result.soap_note.plan.treatment_plan.map((item, index) => (
                    <p key={index} className="text-gray-800 mb-2">{item}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;