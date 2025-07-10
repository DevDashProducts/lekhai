'use client'
import { useRef, useEffect, useState } from 'react'
import { Mic, MicOff } from 'lucide-react'

interface SimpleWaveformVisualizerProps {
  isRecording: boolean
  className?: string
}

export default function SimpleWaveformVisualizer({
  isRecording,
  className = ''
}: SimpleWaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const smoothedDataRef = useRef<Float32Array | null>(null)
  const [amplitude, setAmplitude] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Smoothing parameters
  const SMOOTHING_FACTOR = 0.3
  const MIN_AMPLITUDE = 0.02
  const WAVE_SPEED = 0.05

  // Initialize audio when recording starts
  useEffect(() => {
    let mounted = true

    const initializeAudio = async () => {
      try {
        if (!isRecording) {
          // Cleanup when not recording
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
            animationRef.current = null
          }
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
          }
          if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close()
            audioContextRef.current = null
          }
          analyserRef.current = null
          smoothedDataRef.current = null
          setAmplitude(0)
          setError(null)
          return
        }

        // Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        })

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop())
          return
        }

        // Create audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        
        // Create analyser with optimized settings for smooth visualization
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 2048 // Higher resolution for smoother waves
        analyser.smoothingTimeConstant = 0.85 // More smoothing
        analyser.minDecibels = -90
        analyser.maxDecibels = -10

        // Initialize smoothed data array
        const bufferLength = analyser.frequencyBinCount
        smoothedDataRef.current = new Float32Array(bufferLength)

        // Connect stream to analyser
        const source = audioContext.createMediaStreamSource(stream)
        source.connect(analyser)

        // Store references
        streamRef.current = stream
        audioContextRef.current = audioContext
        analyserRef.current = analyser

        setError(null)
        
        // Start animation
        if (mounted) {
          startAnimation()
        }

      } catch (err) {
        console.error('Failed to initialize audio:', err)
        setError(err instanceof Error ? err.message : 'Failed to access microphone')
      }
    }

    initializeAudio()

    return () => {
      mounted = false
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [isRecording])

  const startAnimation = () => {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    const smoothedData = smoothedDataRef.current

    if (!canvas || !analyser || !smoothedData) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    let time = 0

    const draw = () => {
      if (!isRecording || !analyser) return

      time += WAVE_SPEED
      
      // Get frequency data for smoother visualization
      analyser.getByteFrequencyData(dataArray)

      const width = canvas.width
      const height = canvas.height

      // Clear canvas with subtle gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, '#fafbfc')
      gradient.addColorStop(1, '#f8fafc')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      // Apply smoothing to the data
      let totalAmplitude = 0
      for (let i = 0; i < bufferLength; i++) {
        const rawValue = dataArray[i] / 255.0
        smoothedData[i] = smoothedData[i] * (1 - SMOOTHING_FACTOR) + rawValue * SMOOTHING_FACTOR
        totalAmplitude += smoothedData[i]
      }

      const avgAmplitude = Math.max(totalAmplitude / bufferLength, MIN_AMPLITUDE)
      setAmplitude(avgAmplitude)

      // Create multiple wave layers for a richer effect
      const layers = [
        { color: '#3b82f6', alpha: 0.8, multiplier: 1.0, offset: 0 },
        { color: '#6366f1', alpha: 0.4, multiplier: 0.7, offset: Math.PI / 4 },
        { color: '#8b5cf6', alpha: 0.2, multiplier: 0.5, offset: Math.PI / 2 }
      ]

      layers.forEach((layer, layerIndex) => {
        ctx.strokeStyle = layer.color
        ctx.globalAlpha = layer.alpha
        ctx.lineWidth = layerIndex === 0 ? 2.5 : 1.5
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()

        const points = []
        const numPoints = Math.min(150, bufferLength) // Fewer points for smoother curves

        // Generate smooth curve points
        for (let i = 0; i < numPoints; i++) {
          const dataIndex = Math.floor((i / numPoints) * bufferLength)
          const x = (i / (numPoints - 1)) * width
          
          // Create flowing wave motion
          const baseAmplitude = smoothedData[dataIndex] * layer.multiplier
          const waveOffset = Math.sin(time + layer.offset + (i * 0.1)) * 0.1
          const amplitude = (baseAmplitude + waveOffset) * (height * 0.3)
          
          // Center the wave
          const y = height / 2 + (Math.sin(i * 0.05 + time + layer.offset) * amplitude)
          
          points.push({ x, y })
        }

        // Draw smooth curves using quadratic curves
        if (points.length > 2) {
          ctx.moveTo(points[0].x, points[0].y)
          
          for (let i = 1; i < points.length - 1; i++) {
            const currentPoint = points[i]
            const nextPoint = points[i + 1]
            const controlX = (currentPoint.x + nextPoint.x) / 2
            const controlY = (currentPoint.y + nextPoint.y) / 2
            
            ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, controlX, controlY)
          }
          
          // Complete the last segment
          const lastPoint = points[points.length - 1]
          ctx.lineTo(lastPoint.x, lastPoint.y)
        }

        ctx.stroke()
      })

      // Reset alpha
      ctx.globalAlpha = 1.0

      // Draw subtle center reference line
      if (avgAmplitude < 0.05) {
        ctx.strokeStyle = '#e2e8f0'
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.5
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(0, height / 2)
        ctx.lineTo(width, height / 2)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.globalAlpha = 1.0
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()
  }

  if (error) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full h-20 sm:h-24 bg-red-50 rounded-lg border border-red-200 flex items-center justify-center">
          <div className="text-center">
            <MicOff className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600">Microphone access denied</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={800}
        height={120}
        className="w-full h-20 sm:h-24 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg border border-gray-200 shadow-sm"
      />
      
      {!isRecording && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg border border-gray-200">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
              <Mic className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-sm text-gray-600 font-medium">Click to start recording</p>
            <p className="text-xs text-gray-500 mt-1">Audio waveform will appear here</p>
          </div>
        </div>
      )}
      
      {isRecording && (
        <div className="absolute top-3 right-3">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            amplitude > 0.1 
              ? 'bg-green-100 text-green-700 shadow-sm' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
              amplitude > 0.1 
                ? 'bg-green-500 animate-pulse shadow-sm' 
                : 'bg-gray-400'
            }`}></div>
            <span>{amplitude > 0.1 ? 'Speaking' : 'Listening'}</span>
          </div>
        </div>
      )}

      {isRecording && amplitude > 0.1 && (
        <div className="absolute bottom-3 left-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
            <span>Voice detected</span>
          </div>
        </div>
      )}
    </div>
  )
}