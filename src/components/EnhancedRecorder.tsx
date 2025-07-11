'use client'
import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Settings, Zap, Clock } from 'lucide-react'
import { useWhisperSafe } from '@/hooks/useWhisperSafe'
import { Provider } from '@/types'
import SimpleWaveformVisualizer from './SimpleWaveformVisualizer'
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
  const [recordingDuration, setRecordingDuration] = useState(0)
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
  }, [recording])

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
    if (transcribing) return { text: 'Processing...', disabled: false, variant: 'outline' as const }
    if (recording) return { text: 'Stop Recording', disabled: false, variant: 'destructive' as const }
    return { text: 'Start Recording', disabled: false, variant: 'default' as const }
  }

  const buttonState = getRecordingButtonState()

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden w-full">
      {/* Header */}
      <div className="bg-muted/50 px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Mic className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-medium text-foreground">Voice Recording</h2>
              <p className="text-sm text-muted-foreground">Real-time speech transcription</p>
            </div>
          </div>
          
          {recording && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-background/80 rounded-md px-2 py-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="font-mono text-xs text-foreground">{formatDuration(recordingDuration)}</span>
              </div>
              <div className="flex items-center space-x-2 bg-destructive/10 rounded-md px-2 py-1">
                <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-destructive">Recording</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 w-full max-w-full">
        {/* Provider Selection */}
        <div className="flex items-center justify-between">
          <div className="flex">
            <ProviderSelector
              selectedProvider={provider}
              onProviderChange={onProviderChange}
              disabled={recording || !isReady}
            />
          </div>
        </div>

        {/* Waveform Visualizer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Audio Waveform</span>
            {recording && speaking && (
              <div className="flex items-center space-x-1 text-xs text-green-600">
                <Zap className="w-3 h-3" />
                <span>Voice detected</span>
              </div>
            )}
          </div>
          <SimpleWaveformVisualizer
            isRecording={recording}
            className="transition-all duration-300"
          />
        </div>

        {/* Recording Controls */}
        <div className="flex items-center justify-center py-2">
          <Button
            onClick={recording ? stopRecording : handleStartRecording}
            size="lg"
            variant={buttonState.variant}
            disabled={buttonState.disabled}
            className="px-8 py-6 text-lg font-medium"
          >
            <div className="flex items-center space-x-2">
              {transcribing ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : recording ? (
                <Square className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
              <span>{buttonState.text}</span>
            </div>
          </Button>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-3 gap-3">
          <div className={`text-center p-3 rounded-md transition-colors ${
            recording 
              ? 'bg-destructive/10 text-destructive border border-destructive/20' 
              : 'bg-muted/30 text-muted-foreground'
          }`}>
            <div className="font-medium text-sm">Recording</div>
            <div className="text-xs">{recording ? 'Active' : 'Inactive'}</div>
          </div>
          
          <div className={`text-center p-3 rounded-md transition-colors ${
            speaking 
              ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
              : 'bg-muted/30 text-muted-foreground'
          }`}>
            <div className="font-medium text-sm">Voice</div>
            <div className="text-xs">{speaking ? 'Detected' : 'Silent'}</div>
          </div>
          
          <div className={`text-center p-3 rounded-md transition-colors ${
            transcribing 
              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' 
              : 'bg-muted/30 text-muted-foreground'
          }`}>
            <div className="font-medium text-sm">Processing</div>
            <div className="text-xs">{transcribing ? 'Active' : 'Ready'}</div>
          </div>
        </div>

        {/* Error Display */}
        {hookError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <div className="text-destructive">⚠</div>
              <div>
                <h3 className="text-destructive font-medium text-sm">Audio Processing Error</h3>
                <p className="text-destructive/80 text-sm mt-1">{hookError}</p>
                <p className="text-destructive/70 text-xs mt-2">
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