import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromHeaders } from '@/lib/auth'
import { testConnection } from '@/lib/db'
import { createSession, getSession } from '@/lib/models/session'
import { createTranscript, getRecentTranscripts } from '@/lib/models/transcript'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    if (!getAuthFromHeaders(request.headers)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    }

    // Test 1: Database connection
    results.tests.connection = await testConnection()

    if (!results.tests.connection) {
      return NextResponse.json({
        ...results,
        status: 'failed',
        message: 'Database connection failed'
      }, { status: 500 })
    }

    // Test 2: Create session
    try {
      const session = await createSession({
        ip_address: '127.0.0.1',
        user_agent: 'Test Agent'
      })
      
      results.tests.session_create = {
        success: true,
        session_id: session.id,
        session_token: session.session_token
      }

      // Test 3: Get session
      const retrievedSession = await getSession(session.id)
      results.tests.session_retrieve = {
        success: !!retrievedSession,
        matches: retrievedSession?.id === session.id
      }

      // Test 4: Create transcript
      const transcript = await createTranscript({
        session_id: session.id,
        provider: 'openai',
        transcript_text: 'This is a test transcript for database integration.',
        audio_duration_seconds: 5.2,
        audio_size_bytes: 12345,
        mime_type: 'audio/webm',
        confidence_score: 0.95,
        language_detected: 'en',
        processing_time_ms: 1250
      })

      results.tests.transcript_create = {
        success: true,
        transcript_id: transcript.id,
        text_length: transcript.transcript_text.length
      }

      // Test 5: Get recent transcripts
      const recent = await getRecentTranscripts(5)
      results.tests.transcript_retrieve = {
        success: recent.length > 0,
        count: recent.length,
        includes_test: recent.some(t => t.id === transcript.id)
      }

    } catch (modelError) {
      results.tests.models = {
        success: false,
        error: modelError instanceof Error ? modelError.message : 'Unknown error'
      }
    }

    const allTestsPassed = Object.values(results.tests as Record<string, any>).every((test: any) => 
      typeof test === 'boolean' ? test : !!test?.success
    )

    return NextResponse.json({
      ...results,
      status: allTestsPassed ? 'passed' : 'failed',
      message: allTestsPassed ? 'All database tests passed' : 'Some tests failed'
    })

  } catch (error) {
    console.error('Database model test error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}