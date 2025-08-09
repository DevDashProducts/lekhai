import { NextRequest, NextResponse } from 'next/server'
import { transcribeOpenAI } from '@/lib/providers/openai'
import { transcribeElevenLabs } from '@/lib/providers/elevenlabs'
import { transcribeGemini } from '@/lib/providers/gemini'
import { getAuthFromHeaders } from '@/lib/auth'
import { validateApiKey } from '@/lib/utils'
import { Provider } from '@/types'
// Server-side persistence disabled; keep imports removed

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
    const sessionId = undefined

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

    // Persistence disabled; client stores transcripts in cookies

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