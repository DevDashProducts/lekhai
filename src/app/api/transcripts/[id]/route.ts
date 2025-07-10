import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromHeaders } from '@/lib/auth'
import { getTranscript, deleteTranscript } from '@/lib/models/transcript'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    if (!getAuthFromHeaders(request.headers)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const transcript = await getTranscript(id)

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(transcript)

  } catch (error) {
    console.error('Get transcript error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    if (!getAuthFromHeaders(request.headers)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    
    // Check if transcript exists
    const transcript = await getTranscript(id)
    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      )
    }

    await deleteTranscript(id)

    return NextResponse.json({
      message: 'Transcript deleted successfully',
      id
    })

  } catch (error) {
    console.error('Delete transcript error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}