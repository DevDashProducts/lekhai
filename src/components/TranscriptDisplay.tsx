'use client'
import { useWhisper } from '@cloudraker/use-whisper'
import { Provider, TranscriptEntry } from '@/types'
import { useState, useEffect, useRef } from 'react'
import { Copy, Check, Download, Trash2 } from 'lucide-react'
import { Button } from './ui/button'

interface TranscriptDisplayProps {
  transcript: ReturnType<typeof useWhisper>['transcript']
  provider: Provider
  isTranscribing: boolean
}

export default function TranscriptDisplay({
  transcript,
  provider,
  isTranscribing,
}: TranscriptDisplayProps) {
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([])
  const [copied, setCopied] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load transcripts from session storage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('lekhai-transcripts')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setTranscripts(parsed.map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp)
        })))
      } catch (error) {
        console.error('Failed to load transcripts:', error)
      }
    }
  }, [])

  // Save transcripts to session storage whenever they change
  useEffect(() => {
    sessionStorage.setItem('lekhai-transcripts', JSON.stringify(transcripts))
  }, [transcripts])

  // Add new transcript when it changes
  useEffect(() => {
    if (typeof transcript.text === 'string' && transcript.text.trim()) {
      const newEntry: TranscriptEntry = {
        id: Date.now().toString(),
        text: transcript.text || '',
        provider,
        timestamp: new Date(),
        duration: (transcript as any).duration,
        confidence: (transcript as any).confidence,
      }
      setTranscripts((prev: TranscriptEntry[]): TranscriptEntry[] => {
        const lastEntry = prev[prev.length - 1]
        if (lastEntry && lastEntry.text !== transcript.text) {
          return [...prev.slice(0, -1), { ...lastEntry, text: transcript.text || '' }]
        } else if (!lastEntry || lastEntry.text !== transcript.text) {
          return [...prev, newEntry]
        }
        return prev
      })
    }
  }, [transcript.text, provider, (transcript as any).duration, (transcript as any).confidence])

  // Auto-scroll to bottom when new content is added
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcripts, autoScroll])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const copyAllTranscripts = async () => {
    const allText = transcripts.map(t => t.text).join('\n\n')
    await copyToClipboard(allText)
  }

  const downloadTranscripts = () => {
    const allText = transcripts.map(t => 
      `[${t.timestamp.toLocaleTimeString()}] ${t.text}`
    ).join('\n\n')
    const blob = new Blob([allText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcript-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearTranscripts = () => {
    setTranscripts([])
    sessionStorage.removeItem('lekhai-transcripts')
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Live Transcript
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Provider: {provider}
          </span>
          {isTranscribing && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-yellow-600">Processing...</span>
            </div>
          )}
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="bg-gray-50 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto"
        onScroll={(e) => {
          const target = e.target as HTMLDivElement
          const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 10
          setAutoScroll(isAtBottom)
        }}
      >
        {transcripts.length > 0 ? (
          <div className="space-y-4">
            {transcripts.map((entry, index) => (
              <div key={entry.id} className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500 font-mono">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {entry.provider}
                      </span>
                      {entry.confidence && (
                        <span className="text-xs text-gray-500">
                          Confidence: {Math.round(entry.confidence * 100)}%
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {entry.text}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(entry.text)}
                    className="flex-shrink-0"
                  >
                    <Copy size={14} />
                  </Button>
                </div>
              </div>
            ))}
            {isTranscribing && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-yellow-700">Listening...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 italic text-center">
              Start speaking to see transcription appear here...
              <br />
              <span className="text-sm">
                Using {provider} for speech recognition
              </span>
            </p>
          </div>
        )}
      </div>
      {!autoScroll && transcripts.length > 0 && (
        <div className="mt-2 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAutoScroll(true)
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
            }}
          >
            Scroll to Bottom
          </Button>
        </div>
      )}
    </div>
  )
} 