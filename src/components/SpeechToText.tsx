'use client'
import { useState } from 'react'
import { Mic, MicOff, Settings, Loader2, AlertCircle } from 'lucide-react'
import { useWhisperSafe } from '@/hooks/useWhisperSafe'
import { Provider } from '@/types'
import ProviderSelector from './ProviderSelector'
import TranscriptDisplay from './TranscriptDisplay'
import { Button } from './ui/button'

interface SpeechToTextProps {
  password: string
}

export default function SpeechToText({ password }: SpeechToTextProps) {
  const [provider, setProvider] = useState<Provider>('openai')

  const {
    recording,
    speaking,
    transcribing,
    transcript,
    startRecording,
    stopRecording,
    isReady,
    error: hookError,
  } = useWhisperSafe({
    whisperApiEndpoints: {
      transcriptions: `/api/transcribe/${provider}`,
      translations: `/api/transcribe/${provider}`,
    },
    streaming: true,
    timeSlice: 1000,
    autoTranscribe: true,
    removeSilence: true,
    nonStop: true,
    stopTimeout: 5000,
    onTranscribe: async (blob: Blob) => {
      const formData = new FormData()
      formData.append('file', blob)
      
      const response = await fetch(`/api/transcribe/${provider}`, {
        method: 'POST',
        headers: {
          'x-password': password,
        },
        body: formData,
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Transcription failed')
      }
      
      const data = await response.json()
      return { blob, text: data.text }
    },
  })

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            lekhAI
          </h1>
          <p className="text-gray-600">
            Transform your voice into written words with AI
          </p>
          <p className="text-sm text-gray-500 mt-1">
            <em>lekh</em> (लेख) - Nepali for "writing"
          </p>
        </header>

        {/* Error Display */}
        {hookError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
              <div>
                <h3 className="text-red-800 font-medium">Audio Processing Error</h3>
                <p className="text-red-700 text-sm mt-1">{hookError}</p>
                <p className="text-red-600 text-xs mt-2">
                  Try refreshing the page. If the problem persists, ensure you're using HTTPS and a modern browser.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {!isReady && !hookError && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="text-blue-500 animate-spin flex-shrink-0" size={20} />
              <div>
                <h3 className="text-blue-800 font-medium">Initializing Audio Processing</h3>
                <p className="text-blue-700 text-sm mt-1">Please wait while we set up the audio recording system...</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          {/* Provider Selection */}
          <div className="flex items-center gap-4">
            <Settings className="text-gray-500" size={20} />
            <div className="flex-1">
              <ProviderSelector
                selectedProvider={provider}
                onProviderChange={setProvider}
                disabled={recording || !isReady}
              />
            </div>
          </div>

          {/* Recording Button */}
          <div className="text-center">
            <Button
              onClick={recording ? stopRecording : startRecording}
              size="lg"
              variant={recording ? "destructive" : "default"}
              disabled={!isReady || !!hookError}
              className={`inline-flex items-center gap-3 px-8 py-6 text-lg font-medium transition-all ${
                recording ? 'animate-pulse' : ''
              }`}
            >
              {transcribing ? (
                <Loader2 size={24} className="animate-spin" />
              ) : recording ? (
                <MicOff size={24} />
              ) : (
                <Mic size={24} />
              )}
              {!isReady 
                ? 'Initializing...'
                : transcribing 
                ? 'Processing...' 
                : recording 
                ? 'Stop Recording' 
                : 'Start Recording'
              }
            </Button>
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-3 gap-4">
            <div className={`text-center p-3 rounded-lg transition-colors ${
              recording ? 'bg-red-100 text-red-800' : 'bg-gray-100'
            }`}>
              <div className="font-medium">Recording</div>
              <div className="text-sm">{recording ? 'Active' : 'Inactive'}</div>
            </div>
            <div className={`text-center p-3 rounded-lg transition-colors ${
              speaking ? 'bg-green-100 text-green-800' : 'bg-gray-100'
            }`}>
              <div className="font-medium">Speaking</div>
              <div className="text-sm">{speaking ? 'Detected' : 'Silent'}</div>
            </div>
            <div className={`text-center p-3 rounded-lg transition-colors ${
              transcribing ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'
            }`}>
              <div className="font-medium">Processing</div>
              <div className="text-sm">{transcribing ? 'Transcribing' : 'Ready'}</div>
            </div>
          </div>
        </div>

        {/* Transcript Display */}
        <TranscriptDisplay
          transcript={transcript}
          provider={provider}
          isTranscribing={transcribing}
        />
      </div>
    </div>
  )
} 