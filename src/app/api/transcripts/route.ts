import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromHeaders } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    if (!getAuthFromHeaders(request.headers)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Cookie-based storage only: API not supported now
    return NextResponse.json(
      { error: 'Transcripts API disabled; data stored client-side in cookies' },
      { status: 410 }
    )

  } catch (error) {
    console.error('Transcripts API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}