import { NextRequest, NextResponse } from 'next/server'
import { transcribeOpenAI } from '@/lib/providers/openai'
import { transcribeElevenLabs } from '@/lib/providers/elevenlabs'
import { transcribeGemini } from '@/lib/providers/gemini'
import { getAuthFromHeaders } from '@/lib/auth'
import { validateApiKey } from '@/lib/utils'
import { Provider } from '@/types'
// Server-side persistence disabled; keep imports removed

// Basic per-IP rate limiting (in-memory, best-effort for demo)
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 20
const ipToRequests: Map<string, number[]> = new Map()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  const history = ipToRequests.get(ip) || []
  const recent = history.filter((t) => t > windowStart)
  recent.push(now)
  ipToRequests.set(ip, recent)
  return recent.length > RATE_LIMIT_MAX_REQUESTS
}

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

    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429 }
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

    // Validate file type and size
    const MAX_BYTES = 15 * 1024 * 1024 // 15MB
    const contentType = audioFile.type || ''
    const isAudio = contentType.startsWith('audio/')
    const isWebmVideo = contentType === 'video/webm' // some browsers label mic blobs this way
    if (!isAudio && !isWebmVideo) {
      return NextResponse.json(
        { error: `Invalid file type: ${contentType || 'unknown'}` },
        { status: 415 }
      )
    }
    if (typeof audioFile.size === 'number' && audioFile.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Maximum allowed size is 15MB.' },
        { status: 413 }
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

    // Persistence disabled; client stores transcripts locally (cookies/IndexedDB)

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