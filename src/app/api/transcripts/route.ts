import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromHeaders } from '@/lib/auth'
import { getRecentTranscripts, searchTranscripts, getTranscriptStats } from '@/lib/models/transcript'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    if (!getAuthFromHeaders(request.headers)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')

    switch (action) {
      case 'list':
        const transcripts = await getRecentTranscripts(Math.min(limit, 100)) // Max 100
        return NextResponse.json({
          transcripts,
          count: transcripts.length
        })

      case 'search':
        if (!search) {
          return NextResponse.json(
            { error: 'Search term is required' },
            { status: 400 }
          )
        }
        const searchResults = await searchTranscripts(search, Math.min(limit, 50))
        return NextResponse.json({
          transcripts: searchResults,
          count: searchResults.length,
          search_term: search
        })

      case 'stats':
        const stats = await getTranscriptStats()
        return NextResponse.json(stats)

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: list, search, or stats' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Transcripts API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}