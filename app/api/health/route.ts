import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()
  let dbStatus = 'connected'

  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
    dbStatus = 'disconnected'
  }

  const status = dbStatus === 'connected' ? 'ok' : 'degraded'

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      db: { status: dbStatus, latencyMs: Date.now() - start },
      ai: { provider: process.env.ANTHROPIC_API_KEY ? 'claude' : 'mock' },
    },
    { status: status === 'ok' ? 200 : 503 }
  )
}
