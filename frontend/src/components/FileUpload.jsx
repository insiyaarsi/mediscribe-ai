import { useState } from 'react';
import { Upload, FileAudio, Loader2 } from 'lucide-react';

/**
 * FileUpload Component
 * Handles audio file selection and upload to backend API
 * 
 * Props:
 * - onTranscribe: Function to call when transcription is triggered
 * - isLoading: Boolean indicating if processing is in progress
 */
function FileUpload({ onTranscribe, isLoading }) {
  // Local state for selected file
  const [audioFile, setAudioFile] = useState(null);

  // Handle file selection from input
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/flac'];
      if (validTypes.includes(file.type) || file.name.match(/\.(mp3|wav|m4a|webm|ogg|flac)$/i)) {
        setAudioFile(file);
      } else {
        alert('Please select a valid audio file (MP3, WAV, M4A, WebM, OGG, or FLAC)');
      }
    }
  };

  // Handle transcription trigger
  const handleTranscribeClick = () => {
    if (audioFile) {
      onTranscribe(audioFile);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Upload className="w-6 h-6" />
        Upload Medical Audio
      </h2>

      <div className="space-y-4">
        {/* File Input */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept=".mp3,.wav,.m4a,.webm,.ogg,.flac,audio/*"
            onChange={handleFileChange}
            className="hidden"
            id="audio-upload"
            disabled={isLoading}
          />
          <label
            htmlFor="audio-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <FileAudio className="w-12 h-12 text-gray-400" />
            <span className="text-gray-600">
              {audioFile ? audioFile.name : 'Click to select audio file'}
            </span>
            <span className="text-sm text-gray-500">
              Supported: MP3, WAV, M4A, WebM, OGG, FLAC
            </span>
          </label>
        </div>

        {/* Transcribe Button */}
        <button
          onClick={handleTranscribeClick}
          disabled={!audioFile || isLoading}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
            !audioFile || isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Transcribe & Analyze
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default FileUpload;