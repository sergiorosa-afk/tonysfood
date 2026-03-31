import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { phoneVariants } from '@/lib/utils/phone'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {

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
