'use client'
import { useState, useEffect } from 'react'
import { History, Search, Trash2, Download, Clock, Mic } from 'lucide-react'
import { Button } from './ui/button'
import { Provider } from '@/types'

interface Transcript {
  id: string
  provider: Provider
  transcript_text: string
  audio_duration_seconds?: number
  confidence_score?: number
  created_at: string
  processing_time_ms?: number
}

interface TranscriptHistoryProps {
  password: string
  className?: string
}

export default function TranscriptHistory({ password, className = '' }: TranscriptHistoryProps) {
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [stats, setStats] = useState<any>(null)

  // Load recent transcripts on mount
  useEffect(() => {
    loadTranscripts()
    loadStats()
  }, [])

  const loadTranscripts = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/transcripts?action=list&limit=20', {
        headers: {
          'x-password': password
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to load transcripts')
      }
      
      const data = await response.json()
      setTranscripts(data.transcripts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transcripts')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/transcripts?action=stats', {
        headers: {
          'x-password': password
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (err) {
      console.warn('Failed to load stats:', err)
    }
  }

  const searchTranscripts = async () => {
    if (!searchTerm.trim()) {
      loadTranscripts()
      return
    }

    setIsSearching(true)
    setError(null)
    try {
      const response = await fetch(`/api/transcripts?action=search&search=${encodeURIComponent(searchTerm)}&limit=20`, {
        headers: {
          'x-password': password
        }
      })
      
      if (!response.ok) {
        throw new Error('Search failed')
      }
      
      const data = await response.json()
      setTranscripts(data.transcripts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const deleteTranscript = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transcript?')) {
      return
    }

    try {
      const response = await fetch(`/api/transcripts/${id}`, {
        method: 'DELETE',
        headers: {
          'x-password': password
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete transcript')
      }
      
      // Remove from local state
      setTranscripts(prev => prev.filter(t => t.id !== id))
      
      // Reload stats
      loadStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transcript')
    }
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
      case 'openai': return 'bg-green-100 text-green-800'
      case 'elevenlabs': return 'bg-purple-100 text-purple-800'
      case 'gemini': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && transcripts.length === 0) {
    return (
      <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 sm:px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Transcript History</h2>
              <p className="text-sm text-gray-600">Your recent speech-to-text transcriptions</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transcripts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchTranscripts()}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <Button
            onClick={searchTranscripts}
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
        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.total_transcripts}</div>
              <div className="text-xs text-gray-600">Total Transcripts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.total_duration_hours.toFixed(1)}h</div>
              <div className="text-xs text-gray-600">Total Duration</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.transcripts_by_provider.length}</div>
              <div className="text-xs text-gray-600">Providers Used</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.recent_activity.length}</div>
              <div className="text-xs text-gray-600">Active Days</div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {transcripts.length === 0 ? (
          <div className="text-center py-12">
            <Mic className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transcripts yet</h3>
            <p className="text-gray-600">
              {searchTerm ? 'No transcripts match your search.' : 'Start recording to see your transcripts here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transcripts.map((transcript) => (
              <div key={transcript.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getProviderColor(transcript.provider)}`}>
                      {transcript.provider.toUpperCase()}
                    </span>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(transcript.audio_duration_seconds)}</span>
                      {transcript.confidence_score && (
                        <span>• {(transcript.confidence_score * 100).toFixed(0)}% confidence</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => exportTranscript(transcript)}
                      size="sm"
                      variant="ghost"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => deleteTranscript(transcript.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-gray-900 mb-2 line-clamp-3">{transcript.transcript_text}</p>
                
                <div className="text-xs text-gray-500">
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