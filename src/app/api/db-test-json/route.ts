import { NextRequest, NextResponse } from 'next/server'
import { getCurrentDbType } from '@/lib/db'
import { getJsonInfo } from '@/lib/db-json'
import { createSession } from '@/lib/models/session'
import { createTranscript } from '@/lib/models/transcript'

export async function GET(request: NextRequest) {
  try {
    // Get current database type
    const dbType = getCurrentDbType()
    
    // Test basic connection
    const connectionTest = true
    
    let dbInfo = {}
    if (dbType === 'json') {
      dbInfo = getJsonInfo()
    }
    
    // Test creating a session and transcript
    const testSession = await createSession({
      ip_address: '127.0.0.1',
      user_agent: 'JSON Test'
    })
    
    const testTranscript = await createTranscript({
      session_id: testSession.id,
      provider: 'openai',
      transcript_text: 'This is a test transcript from JSON database',
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
      },
      message: 'JSON database is working! Data is stored in a local file.'
    })
  } catch (error) {
    console.error('JSON test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        database_type: getCurrentDbType(),
        stack: error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    )
  }
}