import { NextRequest, NextResponse } from 'next/server'
import { testConnection, getCurrentDbType } from '@/lib/db'
import { getSqliteInfo } from '@/lib/db-sqlite'
import { createSession } from '@/lib/models/session'
import { createTranscript } from '@/lib/models/transcript'

export async function GET(request: NextRequest) {
  try {
    // Get current database type
    const dbType = getCurrentDbType()
    
    // Test basic connection
    const connectionTest = await testConnection()
    
    let dbInfo = {}
    if (dbType === 'sqlite') {
      dbInfo = getSqliteInfo()
    }
    
    // Test creating a session and transcript
    const testSession = await createSession({
      ip_address: '127.0.0.1',
      user_agent: 'SQLite Test'
    })
    
    const testTranscript = await createTranscript({
      session_id: testSession.id,
      provider: 'openai',
      transcript_text: 'This is a test transcript from SQLite',
      audio_duration_seconds: 5.0,
      processing_time_ms: 1500
    })
    
    return NextResponse.json({
      success: true,
      database_type: dbType,
      connection_test: connectionTest,
      database_info: dbInfo,
      test_data: {
        session: testSession,
        transcript: testTranscript
      }
    })
  } catch (error) {
    console.error('SQLite test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        database_type: getCurrentDbType()
      }, 
      { status: 500 }
    )
  }
}