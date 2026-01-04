/**
 * TranscriptionDisplay Component
 * Shows the full transcribed text from audio
 * 
 * Props:
 * - transcription: String containing the transcribed text
 */
function TranscriptionDisplay({ transcription }) {
  if (!transcription) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Transcription</h2>
      <div className="bg-gray-50 rounded-lg p-6">
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {transcription}
        </p>
      </div>
    </div>
  );
}

export default TranscriptionDisplay;