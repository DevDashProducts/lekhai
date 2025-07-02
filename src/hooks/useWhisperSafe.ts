'use client'
import { useState, useEffect, useCallback } from 'react'

interface UseWhisperSafeConfig {
  whisperApiEndpoints: {
    transcriptions: string
    translations: string
  }
  streaming?: boolean
  timeSlice?: number
  autoTranscribe?: boolean
  removeSilence?: boolean
  nonStop?: boolean
  stopTimeout?: number
  onTranscribe?: (blob: Blob) => Promise<{ blob: Blob; text: string }>
}

interface UseWhisperSafeReturn {
  recording: boolean
  speaking: boolean
  transcribing: boolean
  transcript: { text: string }
  startRecording: () => Promise<void>
  stopRecording: () => void
  isReady: boolean
  error: string | null
}

export function useWhisperSafe(config: UseWhisperSafeConfig): UseWhisperSafeReturn {
  const [recording, setRecording] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [transcript, setTranscript] = useState({ text: '' })
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])

  // Initialize without FFmpeg
  useEffect(() => {
    const initializeRecording = async () => {
      try {
        // Check browser support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Media recording is not supported in this browser')
        }

        // Check for secure context
        if (!window.isSecureContext) {
          throw new Error('Secure context (HTTPS) is required for microphone access')
        }

        setIsReady(true)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize recording')
        setIsReady(false)
      }
    }

    initializeRecording()
  }, [])

  const startRecording = useCallback(async () => {
    try {
      if (!isReady) {
        throw new Error('Recording system is not ready')
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      })

      // Create MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      })

      const chunks: Blob[] = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
          setSpeaking(event.data.size > 1000) // Simple voice activity detection
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: recorder.mimeType })
        
        if (audioBlob.size > 0 && config.onTranscribe) {
          try {
            setTranscribing(true)
            const result = await config.onTranscribe(audioBlob)
            setTranscript({ text: result.text })
          } catch (err) {
            console.error('Transcription failed:', err)
            setError(err instanceof Error ? err.message : 'Transcription failed')
          } finally {
            setTranscribing(false)
          }
        }

        // Clean up
        stream.getTracks().forEach(track => track.stop())
      }

      setMediaRecorder(recorder)
      setAudioChunks(chunks)
      
      // Start recording
      recorder.start(config.timeSlice || 1000)
      setRecording(true)
      setError(null)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording')
      setRecording(false)
    }
  }, [isReady, config.onTranscribe, config.timeSlice])

  const stopRecording = useCallback(() => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop()
      setRecording(false)
      setSpeaking(false)
    }
  }, [mediaRecorder, recording])

  // Auto-stop recording based on stopTimeout
  useEffect(() => {
    if (recording && config.stopTimeout && !speaking) {
      const timeout = setTimeout(() => {
        stopRecording()
      }, config.stopTimeout)

      return () => clearTimeout(timeout)
    }
  }, [recording, speaking, config.stopTimeout, stopRecording])

  return {
    recording,
    speaking,
    transcribing,
    transcript,
    startRecording,
    stopRecording,
    isReady,
    error,
  }
} 