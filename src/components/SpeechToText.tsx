'use client'
import { useState, useCallback } from 'react'
import { AlertCircle } from 'lucide-react'
import { Provider } from '@/types'
import EnhancedRecorder from './EnhancedRecorder'
import StreamingTranscriptDisplay from './StreamingTranscriptDisplay'

interface SpeechToTextProps {
  password: string
}

export default function SpeechToText({ password }: SpeechToTextProps) {
  const [provider, setProvider] = useState<Provider>('openai')
  const [currentTranscript, setCurrentTranscript] = useState<any>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [globalError] = useState<string | null>(null)

  const handleTranscriptUpdate = useCallback((transcript: any) => {
    setCurrentTranscript(transcript)
  }, [])

  const handleRecordingStateChange = useCallback((recording: boolean) => {
    setIsRecording(recording)
  }, [])

  const handleTranscribingStateChange = useCallback((transcribing: boolean) => {
    setIsTranscribing(transcribing)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #3B82F6 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, #6366F1 0%, transparent 50%)`,
          backgroundSize: '400px 400px'
        }}></div>
      </div>

      <div className="relative z-10 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* Header */}
          <header className="text-center py-2 sm:py-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2 sm:mb-4">
              lekhAI
            </h1>
            <p className="text-lg sm:text-xl text-gray-700 mb-2">
              Real-time AI-powered speech transcription
            </p>
            <p className="text-sm text-gray-500">
              <em>lekh</em> (लेख) - Nepali for "writing"
            </p>
          </header>

          {/* Global Error Display */}
          {globalError && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-4">
                  <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="text-red-800 font-semibold">System Error</h3>
                    <p className="text-red-700 mt-1">{globalError}</p>
                    <p className="text-red-600 text-sm mt-2">
                      Please refresh the page or contact support if the issue persists.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 max-w-7xl mx-auto">
            {/* Recording Interface */}
            <div className="space-y-6">
              <EnhancedRecorder
                provider={provider}
                onProviderChange={setProvider}
                password={password}
                onTranscriptUpdate={handleTranscriptUpdate}
                onRecordingStateChange={handleRecordingStateChange}
                onTranscribingStateChange={handleTranscribingStateChange}
              />
            </div>

            {/* Transcript Display */}
            <div className="space-y-6">
              <StreamingTranscriptDisplay
                transcript={currentTranscript || { text: '' }}
                provider={provider}
                isTranscribing={isTranscribing}
                isRecording={isRecording}
              />
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center py-8">
            <div className="text-sm text-gray-500 space-y-2">
              <p>Built by DevDash Labs • Powered by multiple AI providers</p>
              <div className="flex items-center justify-center space-x-4 text-xs">
                <span>OpenAI Whisper</span>
                <span>•</span>
                <span>ElevenLabs</span>
                <span>•</span>
                <span>Google Gemini</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
} 