import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { startWaWebConnection, getWaWebState, isWaWebWorkerRunning } from '@/lib/whatsapp-web/service'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const unitId = (session.user as any)?.unitId as string
  if (!unitId) return NextResponse.json({ error: 'No unitId' }, { status: 400 })

  const current = getWaWebState()
  // Only skip if the worker process is actually alive — prevents getting stuck when
  // the worker crashes but state.json still reads 'connecting'.
  if ((current.status === 'connected' || current.status === 'qr' || current.status === 'connecting') && isWaWebWorkerRunning()) {
    return NextResponse.json(current)
  }

  startWaWebConnection(unitId)

  return NextResponse.json({ status: 'connecting', unitId })
}
