import { NextRequest, NextResponse } from 'next/server'
import { testConnection } from '@/lib/db'
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

    const isConnected = await testConnection()
    
    if (isConnected) {
      return NextResponse.json({
        status: 'connected',
        message: 'Database connection successful',
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json(
        { 
          status: 'disconnected',
          message: 'Database connection failed' 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}