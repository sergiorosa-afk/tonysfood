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
    orderBy: [{ status: 'asc' }, { lastMessageAt: 'desc' }, { createdAt: 'desc' }],
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
