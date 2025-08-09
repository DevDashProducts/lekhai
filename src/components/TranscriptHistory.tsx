'use client'
import { useState, useEffect } from 'react'
import { History, Search, Trash2, Download, Clock, Mic } from 'lucide-react'
import { Button } from './ui/button'
import { Provider } from '@/types'
import { getRecentTranscripts, searchTranscripts, deleteTranscriptById } from '@/lib/cache/transcripts-db'

interface Transcript {
  id: string
  provider: Provider
  transcript_text: string
  audio_duration_seconds?: number
  confidence_score?: number
  created_at: string
  processing_time_ms?: number
}

interface TranscriptHistoryProps { password: string; className?: string }

export default function TranscriptHistory({ password: _password, className = '' }: TranscriptHistoryProps) {
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [stats, setStats] = useState<any>(null)

  // Load recent transcripts from IndexedDB on mount
  useEffect(() => {
    ;(async () => {
      const recent = await getRecentTranscripts(50)
      setTranscripts(recent.map(r => ({
        id: r.id,
        provider: r.provider,
        transcript_text: r.text,
        audio_duration_seconds: r.duration,
        confidence_score: r.confidence,
        created_at: new Date(r.createdAt).toISOString(),
        processing_time_ms: undefined,
      })))
    })()
  }, [])

  const loadTranscripts = async () => {
    setLoading(true)
    setError(null)
    try {
      const recent = await getRecentTranscripts(50)
      setTranscripts(recent.map(r => ({
        id: r.id,
        provider: r.provider,
        transcript_text: r.text,
        audio_duration_seconds: r.duration,
        confidence_score: r.confidence,
        created_at: new Date(r.createdAt).toISOString(),
        processing_time_ms: undefined,
      })))
    } catch {
      setError('Failed to load transcripts')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    // Derive simple stats from local list
    const byProvider: Record<string, number> = {}
    transcripts.forEach(t => { byProvider[t.provider] = (byProvider[t.provider] || 0) + 1 })
    setStats({
      total_transcripts: transcripts.length,
      total_duration_hours: (transcripts.reduce((sum, t) => sum + (t.audio_duration_seconds || 0), 0)) / 3600,
      transcripts_by_provider: Object.entries(byProvider).map(([provider, count]) => ({ provider, count })),
      recent_activity: [],
    })
  }

  const searchTranscriptsLocal = async () => {
    if (!searchTerm.trim()) {
      loadTranscripts()
      return
    }
    setIsSearching(true)
    setError(null)
    try {
      const results = await searchTranscripts(searchTerm, 100)
      setTranscripts(results.map(r => ({
        id: r.id,
        provider: r.provider,
        transcript_text: r.text,
        audio_duration_seconds: r.duration,
        confidence_score: r.confidence,
        created_at: new Date(r.createdAt).toISOString(),
        processing_time_ms: undefined,
      })))
    } finally {
      setIsSearching(false)
    }
  }

  const deleteTranscript = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transcript?')) return
    await deleteTranscriptById(id)
    const updated = transcripts.filter(t => t.id !== id)
    setTranscripts(updated)
    loadStats()
  }

  const exportTranscript = (transcript: Transcript) => {
    const content = `Transcript - ${new Date(transcript.created_at).toLocaleString()}
Provider: ${transcript.provider.toUpperCase()}
Duration: ${transcript.audio_duration_seconds ? `${transcript.audio_duration_seconds.toFixed(1)}s` : 'Unknown'}
Confidence: ${transcript.confidence_score ? `${(transcript.confidence_score * 100).toFixed(1)}%` : 'Unknown'}

Text:
${transcript.transcript_text}`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcript-${transcript.id.slice(0, 8)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toFixed(0).padStart(2, '0')}`
  }

  const getProviderColor = (provider: Provider) => {
    switch (provider) {
      case 'openai': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
      case 'elevenlabs': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
      case 'gemini': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  if (loading && transcripts.length === 0) {
    return (
      <div className={`bg-card border border-border rounded-none p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded-none w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted rounded-none"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-card border border-border rounded-none overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-muted/50 px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-none flex items-center justify-center">
              <History className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-medium text-foreground">Transcript History</h2>
              <p className="text-sm text-muted-foreground">Your recent speech-to-text transcriptions</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search transcripts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchTranscriptsLocal()}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
          </div>
          <Button
            onClick={searchTranscriptsLocal}
            disabled={isSearching}
            variant="outline"
            size="sm"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
          {searchTerm && (
            <Button
              onClick={() => {
                setSearchTerm('')
                loadTranscripts()
              }}
              variant="outline"
              size="sm"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="px-4 py-4 bg-muted/30 border-b border-border">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-background rounded-md">
              <div className="text-2xl font-bold text-primary">{stats.total_transcripts}</div>
              <div className="text-xs text-muted-foreground">Total Transcripts</div>
            </div>
            <div className="p-3 bg-background rounded-md">
              <div className="text-2xl font-bold text-secondary">{stats.total_duration_hours.toFixed(1)}h</div>
              <div className="text-xs text-muted-foreground">Total Duration</div>
            </div>
            <div className="p-3 bg-background rounded-md">
              <div className="text-2xl font-bold text-accent">{stats.transcripts_by_provider.length}</div>
              <div className="text-xs text-muted-foreground">Providers Used</div>
            </div>
            <div className="p-3 bg-background rounded-md">
              <div className="text-2xl font-bold text-green-600">{stats.recent_activity.length}</div>
              <div className="text-xs text-muted-foreground">Active Days</div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 mb-4">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {transcripts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-none flex items-center justify-center">
              <Mic className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No transcripts yet</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'No transcripts match your search.' : 'Start recording to see your transcripts here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transcripts.map((transcript) => (
              <div key={transcript.id} className="group bg-muted/30 rounded-none p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-none border ${getProviderColor(transcript.provider)}`}>
                      {transcript.provider.toUpperCase()}
                    </span>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(transcript.audio_duration_seconds)}</span>
                      {transcript.confidence_score && (
                        <span>• {(transcript.confidence_score * 100).toFixed(0)}% confidence</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={() => exportTranscript(transcript)}
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => deleteTranscript(transcript.id)}
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-foreground mb-2 line-clamp-3">{transcript.transcript_text}</p>
                
                <div className="text-xs text-muted-foreground">
                  {new Date(transcript.created_at).toLocaleString()}
                  {transcript.processing_time_ms && (
                    <span> • Processed in {transcript.processing_time_ms}ms</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {transcripts.length > 0 && (
          <div className="text-center mt-6">
            <Button
              onClick={loadTranscripts}
              variant="outline"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}