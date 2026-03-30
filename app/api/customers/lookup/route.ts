import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { phoneVariants } from '@/lib/utils/phone'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const phone = searchParams.get('phone') ?? ''
  const unitId = searchParams.get('unitId') ?? ''

  if (!phone || !unitId) return NextResponse.json({ found: false })

  const variants = phoneVariants(phone)
  if (!variants.length) return NextResponse.json({ found: false })

  const customer = await prisma.customer.findFirst({
    where: {
      unitId,
      phone: { in: variants },
      active: true,
    },
    select: { id: true, name: true, segment: true, visitCount: true },
  })

  if (!customer) return NextResponse.json({ found: false })

  return NextResponse.json({ found: true, customer })
}
