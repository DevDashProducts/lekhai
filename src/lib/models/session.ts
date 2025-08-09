import { query, getCurrentDbType } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export interface Session {
  id: string
  user_id?: string
  session_token: string
  ip_address?: string
  user_agent?: string
  started_at: Date
  ended_at?: Date
  total_recordings: number
  total_duration_seconds: number
}

export interface CreateSessionData {
  user_id?: string
  ip_address?: string
  user_agent?: string
}

// Create a new session
export async function createSession(data: CreateSessionData = {}): Promise<Session> {
  const id = uuidv4()
  const sessionToken = uuidv4()
  const dbType = getCurrentDbType()
  
  if (dbType === 'json') {
    // Direct JSON operation
    const { jsonQuery } = await import('@/lib/db-json')
    
    const sessionData = {
      id,
      user_id: data.user_id || '00000000-0000-0000-0000-000000000000',
      session_token: sessionToken,
      ip_address: data.ip_address || null,
      user_agent: data.user_agent || null,
      started_at: new Date().toISOString(),
      ended_at: null,
      total_recordings: 0,
      total_duration_seconds: 0
    }
    
    const result = jsonQuery<Session>('sessions', 'insert', sessionData)
    return result.rows[0]
  } else {
    // SQL-based operation (PostgreSQL or converted)
    const sql = `
      INSERT INTO sessions (
        id, user_id, session_token, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `
    
    const values = [
      id,
      data.user_id || '00000000-0000-0000-0000-000000000000',
      sessionToken,
      data.ip_address || null,
      data.user_agent || null
    ]
    
    const result = await query<Session>(sql, values)
    return result.rows[0] || ({
      id,
      user_id: data.user_id || '00000000-0000-0000-0000-000000000000',
      session_token: sessionToken,
      ip_address: data.ip_address || null,
      user_agent: data.user_agent || null,
      started_at: new Date(),
      total_recordings: 0,
      total_duration_seconds: 0
    } as unknown as Session)
  }
}

// Get session by token
export async function getSessionByToken(token: string): Promise<Session | null> {
  const sql = 'SELECT * FROM sessions WHERE session_token = $1'
  const result = await query<Session>(sql, [token])
  return result.rows[0] || null
}

// Get session by ID
export async function getSession(id: string): Promise<Session | null> {
  const sql = 'SELECT * FROM sessions WHERE id = $1'
  const result = await query<Session>(sql, [id])
  return result.rows[0] || null
}

// Update session statistics (called after each transcript)
export async function updateSessionStats(
  sessionId: string, 
  durationSeconds: number = 0
): Promise<void> {
  const sql = `
    UPDATE sessions 
    SET 
      total_recordings = total_recordings + 1,
      total_duration_seconds = total_duration_seconds + $1
    WHERE id = $2
  `
  await query(sql, [durationSeconds, sessionId])
}

// End a session
export async function endSession(sessionId: string): Promise<void> {
  const sql = `
    UPDATE sessions 
    SET ended_at = CURRENT_TIMESTAMP 
    WHERE id = $1 AND ended_at IS NULL
  `
  await query(sql, [sessionId])
}

// Get recent sessions for analytics
export async function getRecentSessions(limit: number = 20): Promise<Session[]> {
  const sql = `
    SELECT * FROM sessions 
    ORDER BY started_at DESC 
    LIMIT $1
  `
  const result = await query<Session>(sql, [limit])
  return result.rows
}

// Get active sessions (not ended)
export async function getActiveSessions(): Promise<Session[]> {
  const sql = `
    SELECT * FROM sessions 
    WHERE ended_at IS NULL 
    ORDER BY started_at DESC
  `
  const result = await query<Session>(sql)
  return result.rows
}

// Clean up old sessions (sessions older than 24 hours without activity)
export async function cleanupOldSessions(): Promise<number> {
  const sql = `
    DELETE FROM sessions 
    WHERE started_at < CURRENT_TIMESTAMP - INTERVAL '24 hours'
    AND ended_at IS NULL
  `
  const result = await query(sql)
  return result.rowCount
}