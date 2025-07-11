'use client'
import { useRef, useEffect, useState } from 'react'

interface WaveformVisualizerProps {
  audioContext?: AudioContext
  audioStream?: MediaStream
  isRecording: boolean
  className?: string
}

export default function WaveformVisualizer({
  audioContext,
  audioStream,
  isRecording,
  className = ''
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const [amplitude, setAmplitude] = useState(0)

  useEffect(() => {
    if (!audioContext || !audioStream || !isRecording) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      analyserRef.current = null
      dataArrayRef.current = null
      return
    }

    // Create analyser node
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.8

    // Connect audio stream to analyser
    const source = audioContext.createMediaStreamSource(audioStream)
    source.connect(analyser)

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    analyserRef.current = analyser
    dataArrayRef.current = dataArray

    return () => {
      source.disconnect()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [audioContext, audioStream, isRecording])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !analyserRef.current || !dataArrayRef.current) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const analyser = analyserRef.current
    const dataArray = dataArrayRef.current

    const draw = () => {
      if (!isRecording) return

      analyser.getByteTimeDomainData(dataArray)

      const width = canvas.width
      const height = canvas.height

      // Clear canvas
      ctx.fillStyle = 'rgb(249, 250, 251)'
      ctx.fillRect(0, 0, width, height)

      // Draw waveform
      ctx.lineWidth = 2
      ctx.strokeStyle = 'rgb(59, 130, 246)'
      ctx.beginPath()

      const sliceWidth = width / dataArray.length
      let x = 0
      let maxAmplitude = 0

      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0
        const y = v * height / 2

        // Track max amplitude for voice activity
        const amplitude = Math.abs(v - 1)
        maxAmplitude = Math.max(maxAmplitude, amplitude)

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        x += sliceWidth
      }

      ctx.stroke()

      // Update amplitude for voice activity detection
      setAmplitude(maxAmplitude)

      // Draw center line
      ctx.strokeStyle = 'rgb(229, 231, 235)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, height / 2)
      ctx.lineTo(width, height / 2)
      ctx.stroke()

      animationRef.current = requestAnimationFrame(draw)
    }

    if (isRecording) {
      draw()
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isRecording])

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={800}
        height={120}
        className="w-full h-20 sm:h-24 bg-gray-50 rounded-lg border border-gray-200"
      />
      {!isRecording && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">Audio waveform will appear here</p>
          </div>
        </div>
      )}
      {isRecording && (
        <div className="absolute top-2 right-2">
          <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium ${
            amplitude > 0.1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              amplitude > 0.1 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}></div>
            <span>{amplitude > 0.1 ? 'Speaking' : 'Listening'}</span>
          </div>
        </div>
      )}
    </div>
  )
}