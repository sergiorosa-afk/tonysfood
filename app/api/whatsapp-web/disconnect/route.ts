import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { disconnectWaWeb } from '@/lib/whatsapp-web/service'
import { prisma } from '@/lib/db'

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const unitId = (session.user as any)?.unitId as string

  await disconnectWaWeb()

  // Mark integration as inactive in DB
  await prisma.integration.updateMany({
    where: { unitId, type: 'whatsapp_web' },
    data: { active: false, config: {} },
  }).catch(() => {})

  return NextResponse.json({ status: 'disconnected' })
}
