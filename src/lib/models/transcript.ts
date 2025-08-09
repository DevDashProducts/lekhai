import { query, transaction, getCurrentDbType } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// Types based on our database schema
export type ProviderType = 'openai' | 'elevenlabs' | 'gemini'
export type TranscriptStatus = 'processing' | 'completed' | 'failed'

export interface Transcript {
  id: string
  session_id?: string
  user_id?: string
  provider: ProviderType
  original_filename?: string
  audio_duration_seconds?: number
  audio_size_bytes?: number
  mime_type?: string
  transcript_text: string
  confidence_score?: number
  language_detected?: string
  status: TranscriptStatus
  processing_time_ms?: number
  provider_response_raw?: any
  created_at: Date
  updated_at: Date
}

export interface CreateTranscriptData {
  session_id?: string
  user_id?: string
  provider: ProviderType
  original_filename?: string
  audio_duration_seconds?: number
  audio_size_bytes?: number
  mime_type?: string
  transcript_text: string
  confidence_score?: number
  language_detected?: string
  processing_time_ms?: number
  provider_response_raw?: any
}

export interface TranscriptWord {
  id: string
  transcript_id: string
  word: string
  start_time_seconds?: number
  end_time_seconds?: number
  confidence?: number
  word_index: number
}

// Create a new transcript
export async function createTranscript(data: CreateTranscriptData): Promise<Transcript> {
  const id = uuidv4()
  const dbType = getCurrentDbType()
  
  if (dbType === 'json') {
    // Direct JSON operation
    const { jsonQuery } = await import('@/lib/db-json')
    
    const transcriptData = {
      id,
      session_id: data.session_id || null,
      user_id: data.user_id || '00000000-0000-0000-0000-000000000000',
      provider: data.provider,
      original_filename: data.original_filename || null,
      audio_duration_seconds: data.audio_duration_seconds || null,
      audio_size_bytes: data.audio_size_bytes || null,
      mime_type: data.mime_type || null,
      transcript_text: data.transcript_text,
      confidence_score: data.confidence_score || null,
      language_detected: data.language_detected || null,
      status: 'completed' as TranscriptStatus,
      processing_time_ms: data.processing_time_ms || null,
      provider_response_raw: data.provider_response_raw || null,
      created_at: new Date(),
      updated_at: new Date()
    }
    
    const result = jsonQuery<Transcript>('transcripts', 'insert', transcriptData)
    return result.rows[0]
  } else {
    // SQL-based operation (PostgreSQL or converted)
    const sql = `
      INSERT INTO transcripts (
        id, session_id, user_id, provider, original_filename, 
        audio_duration_seconds, audio_size_bytes, mime_type, 
        transcript_text, confidence_score, language_detected,
        processing_time_ms, provider_response_raw, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `
    
    const values = [
      id,
      data.session_id || null,
      data.user_id || '00000000-0000-0000-0000-000000000000',
      data.provider,
      data.original_filename || null,
      data.audio_duration_seconds || null,
      data.audio_size_bytes || null,
      data.mime_type || null,
      data.transcript_text,
      data.confidence_score || null,
      data.language_detected || null,
      data.processing_time_ms || null,
      data.provider_response_raw ? JSON.stringify(data.provider_response_raw) : null,
      'completed'
    ]
    
    const result = await query<Transcript>(sql, values)
    return result.rows[0] || {
      id,
      session_id: data.session_id || null,
      user_id: data.user_id || '00000000-0000-0000-0000-000000000000',
      provider: data.provider,
      original_filename: data.original_filename || null,
      audio_duration_seconds: data.audio_duration_seconds || null,
      audio_size_bytes: data.audio_size_bytes || null,
      mime_type: data.mime_type || null,
      transcript_text: data.transcript_text,
      confidence_score: data.confidence_score || null,
      language_detected: data.language_detected || null,
      status: 'completed' as TranscriptStatus,
      processing_time_ms: data.processing_time_ms || null,
      provider_response_raw: data.provider_response_raw || null,
      created_at: new Date(),
      updated_at: new Date()
    } as Transcript
  }
}

// Get transcript by ID
export async function getTranscript(id: string): Promise<Transcript | null> {
  const sql = 'SELECT * FROM transcripts WHERE id = $1'
  const result = await query<Transcript>(sql, [id])
  return result.rows[0] || null
}

// Get transcripts for a session
export async function getTranscriptsBySession(sessionId: string): Promise<Transcript[]> {
  const sql = `
    SELECT * FROM transcripts 
    WHERE session_id = $1 
    ORDER BY created_at DESC
  `
  const result = await query<Transcript>(sql, [sessionId])
  return result.rows
}

// Get recent transcripts (for demo/history view)
export async function getRecentTranscripts(limit: number = 50): Promise<Transcript[]> {
  const sql = `
    SELECT * FROM transcripts 
    WHERE status = 'completed'
    ORDER BY created_at DESC 
    LIMIT $1
  `
  const result = await query<Transcript>(sql, [limit])
  return result.rows
}

// Search transcripts by text content
export async function searchTranscripts(searchTerm: string, limit: number = 20): Promise<Transcript[]> {
  const dbType = getCurrentDbType()
  
  if (dbType === 'json') {
    const { searchInTable } = await import('@/lib/db-json')
    const results = searchInTable<Transcript>('transcripts', ['transcript_text'], searchTerm)
    return results
      .filter(t => t.status === 'completed')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
  } else {
    const sql = `
      SELECT * FROM transcripts 
      WHERE transcript_text ILIKE $1 
      AND status = 'completed'
      ORDER BY created_at DESC 
      LIMIT $2
    `
    const result = await query<Transcript>(sql, [`%${searchTerm}%`, limit])
    return result.rows
  }
}

// Update transcript status
export async function updateTranscriptStatus(id: string, status: TranscriptStatus): Promise<void> {
  const sql = 'UPDATE transcripts SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2'
  await query(sql, [status, id])
}

// Delete transcript
export async function deleteTranscript(id: string): Promise<void> {
  const sql = 'DELETE FROM transcripts WHERE id = $1'
  await query(sql, [id])
}

// Get transcript statistics
export async function getTranscriptStats(): Promise<{
  total_transcripts: number
  total_duration_hours: number
  transcripts_by_provider: { provider: string; count: number }[]
  recent_activity: { date: string; count: number }[]
}> {
  // Get total stats
  const totalSql = `
    SELECT 
      COUNT(*) as total_transcripts,
      COALESCE(SUM(audio_duration_seconds), 0) / 3600.0 as total_duration_hours
    FROM transcripts 
    WHERE status = 'completed'
  `
  const totalResult = await query(totalSql)
  
  // Get provider breakdown
  const providerSql = `
    SELECT provider, COUNT(*) as count 
    FROM transcripts 
    WHERE status = 'completed'
    GROUP BY provider 
    ORDER BY count DESC
  `
  const providerResult = await query(providerSql)
  
  // Get recent activity (last 7 days)
  const activitySql = `
    SELECT 
      DATE_TRUNC('day', created_at)::date as date,
      COUNT(*) as count
    FROM transcripts 
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    AND status = 'completed'
    GROUP BY DATE_TRUNC('day', created_at)
    ORDER BY date DESC
  `
  const activityResult = await query(activitySql)
  
  return {
    total_transcripts: parseInt(totalResult.rows[0].total_transcripts),
    total_duration_hours: parseFloat(totalResult.rows[0].total_duration_hours),
    transcripts_by_provider: providerResult.rows,
    recent_activity: activityResult.rows
  }
}

// Add words for a transcript (for future word-level features)
export async function addTranscriptWords(
  transcriptId: string, 
  words: Omit<TranscriptWord, 'id' | 'transcript_id'>[]
): Promise<void> {
  if (words.length === 0) return
  
  await transaction(async (client) => {
    // First, delete existing words for this transcript
    await client.query('DELETE FROM transcript_words WHERE transcript_id = $1', [transcriptId])
    
    // Then insert new words
    const values = words.map((word) => [
      uuidv4(),
      transcriptId,
      word.word,
      word.start_time_seconds || null,
      word.end_time_seconds || null,
      word.confidence || null,
      word.word_index
    ])
    
    const placeholders = values.map((_, i) => 
      `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, $${i * 7 + 4}, $${i * 7 + 5}, $${i * 7 + 6}, $${i * 7 + 7})`
    ).join(', ')
    
    const sql = `
      INSERT INTO transcript_words (
        id, transcript_id, word, start_time_seconds, 
        end_time_seconds, confidence, word_index
      ) VALUES ${placeholders}
    `
    
    await client.query(sql, values.flat())
  })
}