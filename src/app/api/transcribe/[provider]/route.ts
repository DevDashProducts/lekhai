import { NextRequest, NextResponse } from 'next/server'
import { transcribeOpenAI } from '@/lib/providers/openai'
import { transcribeElevenLabs } from '@/lib/providers/elevenlabs'
import { transcribeGemini } from '@/lib/providers/gemini'
import { getAuthFromHeaders } from '@/lib/auth'
import { validateApiKey } from '@/lib/utils'
import { Provider } from '@/types'
import { errorResponse } from '@/lib/errors'
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
      return errorResponse({ error_code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401)
    }

    // Rate limit by IP (disabled in non-production to support streaming)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const isProd = process.env.NODE_ENV === 'production'
    if (isProd && isRateLimited(ip)) {
      return errorResponse({ error_code: 'RATE_LIMITED', message: 'Too many requests. Please try again shortly.' }, 429)
    }

    const provider = providerParam.toLowerCase() as Provider
    
    // Validate provider
    if (!['openai', 'elevenlabs', 'gemini'].includes(provider)) {
      return errorResponse({ error_code: 'UNSUPPORTED_PROVIDER', message: `Unsupported provider: ${provider}` }, 400)
    }

    // Check if API key is available for provider
    if (!validateApiKey(provider)) {
      return errorResponse({ error_code: 'BAD_REQUEST', message: `API key not configured for ${provider}` }, 400)
    }

    const formData = await request.formData()
    const audioFile = formData.get('file') as File

    if (!audioFile) {
      return errorResponse({ error_code: 'BAD_REQUEST', message: 'No audio file provided' }, 400)
    }

    // Validate file type and size
    const MAX_BYTES = 15 * 1024 * 1024 // 15MB
    const contentType = audioFile.type || ''
    const isAudio = contentType.startsWith('audio/')
    const isWebmVideo = contentType === 'video/webm' // some browsers label mic blobs this way
    if (!isAudio && !isWebmVideo) {
      return errorResponse({ error_code: 'INVALID_FILE_TYPE', message: `Invalid file type: ${contentType || 'unknown'}` }, 415)
    }
    if (typeof audioFile.size === 'number' && audioFile.size > MAX_BYTES) {
      return errorResponse({ error_code: 'FILE_TOO_LARGE', message: 'File too large. Maximum allowed size is 15MB.' }, 413)
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
    return errorResponse({ error_code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Transcription failed' }, 500)
  }
} 