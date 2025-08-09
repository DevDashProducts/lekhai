import { NextResponse } from 'next/server'

// Deprecated: SQLite testing is disabled in favor of cookie/JSON storage
export async function GET() {
  return NextResponse.json({ success: false, error: 'SQLite disabled in this build' }, { status: 410 })
}