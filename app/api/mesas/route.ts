import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/mesas?unitId=xxx — lista todas as mesas ativas com ocupação atual
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const unitId = req.nextUrl.searchParams.get('unitId')
  if (!unitId) return NextResponse.json({ error: 'unitId obrigatório' }, { status: 400 })

  const mesas = await prisma.mesa.findMany({
    where: { unitId, ativo: true },
    orderBy: [{ posY: 'asc' }, { posX: 'asc' }, { numero: 'asc' }],
    include: {
      queueEntries: {
        where: { status: { in: ['CALLED', 'SEATED'] } },
        select: {
          id: true,
          guestName: true,
          partySize: true,
          status: true,
          calledAt: true,
        },
        take: 1,
        orderBy: { calledAt: 'desc' },
      },
    },
  })

  const grupos = await prisma.mesaGrupo.findMany({
    where: { unitId, status: 'ATIVO' },
    include: {
      mesas: { select: { mesaId: true } },
      queueEntries: {
        where: { status: { in: ['CALLED', 'SEATED'] } },
        select: { id: true, guestName: true, partySize: true, status: true },
        take: 1,
      },
    },
  })

  return NextResponse.json({ mesas, grupos })
}

// POST /api/mesas — cria uma nova mesa
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { unitId, numero, capacidade = 4, forma = 'retangular', posX = 0, posY = 0, largura = 1, altura = 1 } = body

  if (!unitId || !numero) {
    return NextResponse.json({ error: 'unitId e numero são obrigatórios' }, { status: 400 })
  }

  try {
    const mesa = await prisma.mesa.create({
      data: { unitId, numero, capacidade, forma, posX, posY, largura, altura },
    })
    return NextResponse.json(mesa, { status: 201 })
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Já existe uma mesa com esse número.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erro ao criar mesa.' }, { status: 500 })
  }
}
