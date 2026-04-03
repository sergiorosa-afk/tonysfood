import { prisma } from '@/lib/db'

export type InboxFilters = {
  unitId?: string
  status?: string
  q?: string
}

export async function getConversations(filters: InboxFilters = {}) {
  const { unitId, status, q } = filters

  return prisma.conversation.findMany({
    where: {
      ...(unitId ? { unitId } : {}),
      ...(status && status !== 'all' ? { status } : {}),
      ...(q
        ? {
            OR: [
              { guestName: { contains: q } },
              { guestPhone: { contains: q } },
              { customer: { name: { contains: q } } },
              { customer: { email: { contains: q } } },
              { customer: { phone: { contains: q } } },
            ],
          }
        : {}),
    },
    include: {
      customer: { select: { id: true, name: true, segment: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
  }).then((convs) => {
    // Ordena: OPEN primeiro, PENDING segundo, demais depois — dentro de cada grupo por data
    const priority: Record<string, number> = { OPEN: 0, PENDING: 1 }
    return convs.sort((a, b) => {
      const pa = priority[a.status] ?? 2
      const pb = priority[b.status] ?? 2
      if (pa !== pb) return pa - pb
      const ta = new Date(a.lastMessageAt ?? a.createdAt).getTime()
      const tb = new Date(b.lastMessageAt ?? b.createdAt).getTime()
      return tb - ta
    })
  })
}

export async function getConversationById(id: string) {
  return prisma.conversation.findUnique({
    where: { id },
    include: {
      customer: {
        include: {
          tags: true,
          reservations: {
            orderBy: { date: 'desc' },
            take: 3,
          },
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
      },
      unit: true,
    },
  })
}

export async function getInboxStats(unitId?: string) {
  const where = unitId ? { unitId } : {}

  const [open, pending, resolved] = await Promise.all([
    prisma.conversation.count({ where: { ...where, status: 'OPEN' } }),
    prisma.conversation.count({ where: { ...where, status: 'PENDING' } }),
    prisma.conversation.count({ where: { ...where, status: 'RESOLVED' } }),
  ])

  return { open, pending, resolved, total: open + pending + resolved }
}
