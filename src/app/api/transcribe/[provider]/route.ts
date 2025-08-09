import { NextRequest, NextResponse } from 'next/server'
import { transcribeOpenAI } from '@/lib/providers/openai'
import { transcribeElevenLabs } from '@/lib/providers/elevenlabs'
import { transcribeGemini } from '@/lib/providers/gemini'
import { getAuthFromHeaders } from '@/lib/auth'
import { validateApiKey } from '@/lib/utils'
import { Provider } from '@/types'
import { createTranscript } from '@/lib/models/transcript'
import { createSession, getSessionByToken, updateSessionStats } from '@/lib/models/session'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const startTime = Date.now()
    
    // Await the params in Next.js 15
    const { provider: providerParam } = await params
    
    // Check authentication
    if (!getAuthFromHeaders(request.headers)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const provider = providerParam.toLowerCase() as Provider
    
    // Validate provider
    if (!['openai', 'elevenlabs', 'gemini'].includes(provider)) {
      return NextResponse.json(
        { error: `Unsupported provider: ${provider}` },
        { status: 400 }
      )
    }

    // Check if API key is available for provider
    if (!validateApiKey(provider)) {
      return NextResponse.json(
        { error: `API key not configured for ${provider}` },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const audioFile = formData.get('file') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Get or create session for tracking
    let sessionId: string | undefined
    try {
      const sessionToken = request.headers.get('x-session-token')
      if (sessionToken) {
        const existingSession = await getSessionByToken(sessionToken)
        sessionId = existingSession?.id
      }
      
      // If no session found, create a new one
      if (!sessionId) {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
        const newSession = await createSession({
          ip_address: ip,
          user_agent: request.headers.get('user-agent') || undefined
        })
        sessionId = newSession.id
      }
    } catch (dbError) {
      // Don't fail the transcription if database is unavailable
      console.warn('Database session error (continuing without persistence):', dbError)
    }

    // Route to appropriate provider
    let result
    switch (provider) {
      case 'openai':
        result = await transcribeOpenAI(audioFile)
        break
      case 'elevenlabs':
        result = await transcribeElevenLabs(audioFile)
        break
      case 'gemini':
        result = await transcribeGemini(audioFile)
        break
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }

    // Calculate processing time
    const processingTime = Date.now() - startTime

    // Save transcript to database (non-blocking)
    try {
      const transcript = await createTranscript({
        session_id: sessionId,
        provider,
        original_filename: audioFile.name,
        audio_duration_seconds: result.duration,
        audio_size_bytes: audioFile.size,
        mime_type: audioFile.type,
        transcript_text: result.text,
        confidence_score: result.confidence,
        language_detected: (result as any).language || 'en',
        processing_time_ms: processingTime,
        provider_response_raw: (result as any).raw || null
      })

      // Update session statistics
      if (sessionId) {
        await updateSessionStats(sessionId, result.duration || 0)
      }

      console.log(`Transcript saved: ${transcript.id} (${provider}, ${processingTime}ms)`)
    } catch (dbError) {
      // Don't fail the API call if database save fails
      console.error('Database save error (transcript still returned):', dbError)
    }

    return NextResponse.json({
      text: result.text,
      provider,
      duration: result.duration,
      confidence: result.confidence,
      session_id: sessionId,
      processing_time_ms: processingTime
    })

  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Transcription failed',
        provider: (await params).provider 
      },
      { status: 500 }
    )
  }
} 