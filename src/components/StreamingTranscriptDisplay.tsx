'use client'
import { useState, useEffect, useRef } from 'react'
import { Copy, Download, Edit3, Search, X, Check } from 'lucide-react'
import { Provider, TranscriptEntry } from '@/types'
import { addTranscript, getRecentTranscripts } from '@/lib/cache/transcripts-db'
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
  isRecording: _isRecording,
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

  // Load transcripts from IndexedDB
  useEffect(() => {
    ;(async () => {
      try {
        const recent = await getRecentTranscripts(50)
        setTranscripts(recent.map(r => ({
          id: r.id,
          text: r.text,
          provider: r.provider,
          timestamp: new Date(r.createdAt),
          duration: r.duration,
          confidence: r.confidence,
        })))
      } catch {
        // ignore
      }
    })()
  }, [])

  // Persist to IndexedDB when a new transcript arrives
  useEffect(() => {
    if (!transcript?.text || !transcript.text.trim()) return
    const record = {
      id: Date.now().toString(),
      provider,
      text: transcript.text,
      createdAt: Date.now(),
      duration: transcript.duration,
      confidence: transcript.confidence,
    }
    addTranscript(record).catch(() => {})
  }, [transcript.text, transcript.duration, transcript.confidence, provider])

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
    return text.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100 px-1 rounded font-medium">$1</mark>')
  }

  const filteredTranscripts = searchTerm.trim()
    ? transcripts.filter(t => t.text.toLowerCase().includes(searchTerm.toLowerCase()))
    : transcripts

  return (
    <div className="bg-card border border-border rounded-none overflow-hidden">
      {/* Header */}
      <div className="bg-muted/50 px-4 py-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center space-x-3">
            <h2 className="font-medium text-foreground">Live Transcript</h2>
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-none">
              {provider.toUpperCase()}
            </span>
            {isTranscribing && (
              <div className="flex items-center space-x-1 text-xs text-yellow-600">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span>Processing...</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-8 py-2 text-sm bg-background border border-border rounded-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
              className="text-muted-foreground hover:text-foreground"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadTranscripts}
              className="text-muted-foreground hover:text-foreground"
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
        className="max-h-80 sm:max-h-96 overflow-y-auto p-4"
        onScroll={(e) => {
          const target = e.target as HTMLDivElement
          const isAtTop = target.scrollTop <= 10
          setAutoScroll(isAtTop)
        }}
      >
        {filteredTranscripts.length > 0 ? (
              <div className="space-y-3">
            {filteredTranscripts.map((entry) => (
                  <div key={entry.id} className="group bg-muted/30 rounded-none p-3 border border-border hover:border-border/80 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    {/* Metadata */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-none font-medium">
                        {entry.provider.toUpperCase()}
                      </span>
                      {entry.confidence && (
                        <span className="text-xs text-muted-foreground">
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
                          className="w-full p-3 bg-background border border-border rounded-none text-foreground focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
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
                        className="text-foreground leading-relaxed whitespace-pre-wrap"
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
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(entry.text)}
                      className="text-muted-foreground hover:text-foreground"
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
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-none flex items-center justify-center">
                <svg className="w-8 h-8 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 715 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Start Speaking</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                Your voice will be transcribed in real-time using <span className="font-medium text-primary">{provider.toUpperCase()}</span>. 
                Start recording to see your words appear here instantly.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Auto-scroll indicator */}
      {!autoScroll && transcripts.length > 0 && (
        <div className="border-t border-border p-3 text-center">
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