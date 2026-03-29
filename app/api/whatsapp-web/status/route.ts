import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getWaWebState } from '@/lib/whatsapp-web/service'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const state = getWaWebState()
  return NextResponse.json(state)
}
