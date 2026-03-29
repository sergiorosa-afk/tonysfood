import { prisma } from '@/lib/db'

export type CustomerFilters = {
  unitId?: string
  segment?: string
  q?: string
  active?: boolean
}

export async function getCustomers(filters: CustomerFilters = {}) {
  const { unitId, segment, q, active = true } = filters

  return prisma.customer.findMany({
    where: {
      ...(unitId ? { unitId } : {}),
      ...(segment && segment !== 'all' ? { segment: segment as any } : {}),
      ...(active !== undefined ? { active } : {}),
      ...(q ? {
        OR: [
          { name: { contains: q } },
          { phone: { contains: q } },
          { email: { contains: q } },
        ],
      } : {}),
    },
    include: {
      tags: true,
      _count: {
        select: {
          reservations: true,
          conversations: true,
          queueEntries: true,
        },
      },
    },
    orderBy: [
      { segment: 'asc' },
      { visitCount: 'desc' },
      { name: 'asc' },
    ],
  })
}

export async function getCustomerById(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      tags: { orderBy: { createdAt: 'asc' } },
      unit: true,
      reservations: {
        orderBy: { date: 'desc' },
        take: 20,
      },
      queueEntries: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      conversations: {
        orderBy: { lastMessageAt: 'desc' },
        take: 20,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  })
}

export async function getCustomerStats(unitId?: string) {
  const [total, vip, newCustomers, inactive] = await Promise.all([
    prisma.customer.count({ where: { ...(unitId ? { unitId } : {}), active: true } }),
    prisma.customer.count({ where: { ...(unitId ? { unitId } : {}), segment: 'VIP', active: true } }),
    prisma.customer.count({ where: { ...(unitId ? { unitId } : {}), segment: 'NEW', active: true } }),
    prisma.customer.count({ where: { ...(unitId ? { unitId } : {}), segment: 'INACTIVE', active: true } }),
  ])
  return { total, vip, newCustomers, inactive }
}
