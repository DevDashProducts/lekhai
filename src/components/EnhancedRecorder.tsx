'use client'
import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Settings, Zap, Clock } from 'lucide-react'
import { useWhisperSafe } from '@/hooks/useWhisperSafe'
import { Provider } from '@/types'
import WaveformVisualizer from './WaveformVisualizer'
import ProviderSelector from './ProviderSelector'
import { Button } from './ui/button'

interface EnhancedRecorderProps {
  provider: Provider
  onProviderChange: (provider: Provider) => void
  password: string
  onTranscriptUpdate: (transcript: any) => void
  onRecordingStateChange?: (recording: boolean) => void
  onTranscribingStateChange?: (transcribing: boolean) => void
}

export default function EnhancedRecorder({
  provider,
  onProviderChange,
  password,
  onTranscriptUpdate,
  onRecordingStateChange,
  onTranscribingStateChange
}: EnhancedRecorderProps) {
  const [audioContext, setAudioContext] = useState<AudioContext>()
  const [audioStream, setAudioStream] = useState<MediaStream>()
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [isInitializing, setIsInitializing] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

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
    stopTimeout: 3000,
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

  // Initialize audio context and stream
  useEffect(() => {
    const initAudio = async () => {
      if (!recording) return

      try {
        setIsInitializing(true)
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
          } 
        })
        
        const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 })
        
        setAudioStream(stream)
        setAudioContext(context)
      } catch (error) {
        console.error('Failed to initialize audio:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    if (recording) {
      initAudio()
    } else {
      // Cleanup when not recording
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop())
        setAudioStream(undefined)
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close()
        setAudioContext(undefined)
      }
    }

    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop())
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close()
      }
    }
  }, [recording])

  // Track recording duration
  useEffect(() => {
    if (recording) {
      setRecordingDuration(0)
      intervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      setRecordingDuration(0)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [recording, audioContext, audioStream])

  // Pass transcript updates to parent
  useEffect(() => {
    if (transcript) {
      onTranscriptUpdate(transcript)
    }
  }, [transcript, onTranscriptUpdate])

  // Pass recording state to parent
  useEffect(() => {
    onRecordingStateChange?.(recording)
  }, [recording, onRecordingStateChange])

  // Pass transcribing state to parent
  useEffect(() => {
    onTranscribingStateChange?.(transcribing)
  }, [transcribing, onTranscribingStateChange])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartRecording = async () => {
    try {
      await startRecording()
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }

  const getRecordingButtonState = () => {
    if (!isReady) return { text: 'Initializing...', disabled: true, variant: 'outline' as const }
    if (isInitializing) return { text: 'Preparing Audio...', disabled: true, variant: 'outline' as const }
    if (transcribing) return { text: 'Processing...', disabled: false, variant: 'outline' as const }
    if (recording) return { text: 'Stop Recording', disabled: false, variant: 'destructive' as const }
    return { text: 'Start Recording', disabled: false, variant: 'default' as const }
  }

  const buttonState = getRecordingButtonState()

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Voice Recording</h2>
              <p className="text-sm text-gray-600">Real-time speech transcription</p>
            </div>
          </div>
          
          {recording && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatDuration(recordingDuration)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-red-600">Recording</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Provider Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center space-x-3">
            <Settings className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">AI Provider</span>
          </div>
          <div className="flex-1 max-w-full sm:max-w-xs">
            <ProviderSelector
              selectedProvider={provider}
              onProviderChange={onProviderChange}
              disabled={recording || !isReady}
            />
          </div>
        </div>

        {/* Waveform Visualizer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Audio Input</span>
            {recording && speaking && (
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <Zap className="w-4 h-4" />
                <span>Voice detected</span>
              </div>
            )}
          </div>
          <WaveformVisualizer
            audioContext={audioContext}
            audioStream={audioStream}
            isRecording={recording}
            className="transition-all duration-300"
          />
        </div>

        {/* Recording Controls */}
        <div className="flex items-center justify-center">
          <Button
            onClick={recording ? stopRecording : handleStartRecording}
            size="lg"
            variant={buttonState.variant}
            disabled={buttonState.disabled}
            className={`px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-medium transition-all duration-200 ${
              recording 
                ? 'hover:bg-red-600 shadow-lg shadow-red-200' 
                : 'hover:shadow-lg shadow-blue-200 bg-gradient-to-r from-blue-500 to-indigo-600 border-0'
            }`}
          >
            <div className="flex items-center space-x-3">
              {transcribing ? (
                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : recording ? (
                <Square className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
              <span>{buttonState.text}</span>
            </div>
          </Button>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-3 gap-4">
          <div className={`text-center p-4 rounded-xl transition-all duration-200 ${
            recording 
              ? 'bg-red-50 border-red-200 text-red-800 border' 
              : 'bg-gray-50 border-gray-200 text-gray-600 border'
          }`}>
            <div className="font-semibold">Recording</div>
            <div className="text-sm opacity-75">{recording ? 'Active' : 'Inactive'}</div>
          </div>
          
          <div className={`text-center p-4 rounded-xl transition-all duration-200 ${
            speaking 
              ? 'bg-green-50 border-green-200 text-green-800 border' 
              : 'bg-gray-50 border-gray-200 text-gray-600 border'
          }`}>
            <div className="font-semibold">Voice</div>
            <div className="text-sm opacity-75">{speaking ? 'Detected' : 'Silent'}</div>
          </div>
          
          <div className={`text-center p-4 rounded-xl transition-all duration-200 ${
            transcribing 
              ? 'bg-yellow-50 border-yellow-200 text-yellow-800 border' 
              : 'bg-gray-50 border-gray-200 text-gray-600 border'
          }`}>
            <div className="font-semibold">Processing</div>
            <div className="text-sm opacity-75">{transcribing ? 'Active' : 'Ready'}</div>
          </div>
        </div>

        {/* Error Display */}
        {hookError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 text-red-500">⚠</div>
              <div>
                <h3 className="text-red-800 font-medium">Audio Processing Error</h3>
                <p className="text-red-700 text-sm mt-1">{hookError}</p>
                <p className="text-red-600 text-xs mt-2">
                  Please ensure microphone access is granted and try refreshing the page.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}