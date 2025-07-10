'use client'
import { useState, useEffect, useRef } from 'react'
import { Copy, Download, Edit3, Search, X, Check } from 'lucide-react'
import { Provider, TranscriptEntry } from '@/types'
import { Button } from './ui/button'

interface StreamingTranscriptDisplayProps {
  transcript: any
  provider: Provider
  isTranscribing: boolean
  isRecording: boolean
}

export default function StreamingTranscriptDisplay({
  transcript,
  provider,
  isTranscribing,
  isRecording
}: StreamingTranscriptDisplayProps) {
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([])
  const [currentText, setCurrentText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [copied, setCopied] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLTextAreaElement>(null)

  // Load transcripts from session storage
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

  // Save transcripts to session storage
  useEffect(() => {
    sessionStorage.setItem('lekhai-transcripts', JSON.stringify(transcripts))
  }, [transcripts])

  // Handle transcript updates (both during and after recording)
  useEffect(() => {
    if (typeof transcript.text === 'string' && transcript.text.trim()) {
      setCurrentText(transcript.text)
      
      // Create transcript entry when we get a new transcript
      const newEntry: TranscriptEntry = {
        id: Date.now().toString(),
        text: transcript.text,
        provider,
        timestamp: new Date(),
        duration: transcript.duration,
        confidence: transcript.confidence,
      }

      setTranscripts(prev => {
        // Check if this transcript already exists (prevent duplicates)
        const exists = prev.some(t => t.text === transcript.text && 
          Math.abs(t.timestamp.getTime() - newEntry.timestamp.getTime()) < 5000)
        
        if (exists) {
          return prev
        }
        
        // Add new transcript at the beginning (latest first)
        return [newEntry, ...prev]
      })
    }
  }, [transcript.text, provider, transcript.duration, transcript.confidence])

  // Auto-scroll to top (since latest is first)
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0
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
    const content = transcripts.map(t => 
      `[${t.timestamp.toLocaleTimeString()}] ${t.text}`
    ).join('\n\n')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lekhai-transcript-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const startEditing = (id: string, text: string) => {
    setIsEditing(true)
    setEditingId(id)
    setCurrentText(text)
    setTimeout(() => editInputRef.current?.focus(), 100)
  }

  const saveEdit = () => {
    if (editingId) {
      setTranscripts(prev => 
        prev.map(t => 
          t.id === editingId ? { ...t, text: currentText } : t
        )
      )
    }
    setIsEditing(false)
    setEditingId(null)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setEditingId(null)
    setCurrentText('')
  }

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
  }

  const filteredTranscripts = searchTerm.trim()
    ? transcripts.filter(t => 
        t.text.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : transcripts

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-4 sm:px-6 py-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-900">Live Transcript</h2>
            <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
              {provider}
            </span>
            {isTranscribing && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-yellow-600">Processing...</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Actions */}
            <Button
              variant="ghost"
              size="sm"
              onClick={copyAllTranscripts}
              className="text-gray-600 hover:text-gray-900"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadTranscripts}
              className="text-gray-600 hover:text-gray-900"
              disabled={transcripts.length === 0}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Transcript Content */}
      <div 
        ref={scrollRef}
        className="max-h-80 sm:max-h-96 overflow-y-auto p-4 sm:p-6"
        onScroll={(e) => {
          const target = e.target as HTMLDivElement
          const isAtTop = target.scrollTop <= 10
          setAutoScroll(isAtTop)
        }}
      >
        {filteredTranscripts.length > 0 ? (
          <div className="space-y-4">
            {filteredTranscripts.map((entry) => (
              <div key={entry.id} className="group bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100 hover:border-gray-200 transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    {/* Metadata */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs text-gray-500 font-mono">
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {entry.provider}
                      </span>
                      {entry.confidence && (
                        <span className="text-xs text-gray-500">
                          {Math.round(entry.confidence * 100)}% confident
                        </span>
                      )}
                    </div>
                    
                    {/* Text Content */}
                    {isEditing && editingId === entry.id ? (
                      <div className="space-y-2">
                        <textarea
                          ref={editInputRef}
                          value={currentText}
                          onChange={(e) => setCurrentText(e.target.value)}
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEdit}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p 
                        className="text-gray-800 leading-relaxed whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: highlightText(entry.text, searchTerm)
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(entry.id, entry.text)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(entry.text)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start Speaking</h3>
              <p className="text-gray-500 text-center max-w-sm">
                Your voice will be transcribed in real-time using {provider}. 
                Start recording to see your words appear here instantly.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Auto-scroll indicator */}
      {!autoScroll && transcripts.length > 0 && (
        <div className="border-t border-gray-100 p-3 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAutoScroll(true)
              scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="text-sm"
          >
            Scroll to latest
          </Button>
        </div>
      )}
    </div>
  )
}