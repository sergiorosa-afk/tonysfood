import { prisma } from '@/lib/db'

export async function getMesas(unitId: string) {
  return prisma.mesa.findMany({
    where: { unitId, ativo: true },
    orderBy: [{ posY: 'asc' }, { posX: 'asc' }, { numero: 'asc' }],
  })
}

export async function getMesasComOcupacao(unitId: string) {
  return prisma.mesa.findMany({
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
          seatedAt: true,
        },
        take: 1,
        orderBy: { calledAt: 'desc' },
      },
    },
  })
}

export async function getMesasComGrupos(unitId: string) {
  const mesas = await getMesasComOcupacao(unitId)
  const grupos = await prisma.mesaGrupo.findMany({
    where: { unitId, status: 'ATIVO' },
    include: {
      mesas: { include: { mesa: true } },
      queueEntries: {
        where: { status: { in: ['CALLED', 'SEATED'] } },
        select: { id: true, guestName: true, partySize: true, status: true },
        take: 1,
      },
    },
  })
  return { mesas, grupos }
}

export async function getEstatisticasMesas(unitId: string) {
  const [total, livres, ocupadas] = await Promise.all([
    prisma.mesa.count({ where: { unitId, ativo: true } }),
    prisma.mesa.count({ where: { unitId, ativo: true, status: 'LIVRE' } }),
    prisma.mesa.count({ where: { unitId, ativo: true, status: 'OCUPADA' } }),
  ])
  return { total, livres, ocupadas }
}
