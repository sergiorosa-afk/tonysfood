import { prisma } from '@/lib/db'

export async function getDashboardStats(unitId?: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [
    reservationsToday,
    reservationsConfirmedToday,
    queueWaiting,
    queueCalled,
    openConversations,
    pendingConversations,
    totalCustomers,
    vipCustomers,
  ] = await Promise.all([
    prisma.reservation.count({
      where: {
        ...(unitId ? { unitId } : {}),
        date: { gte: today, lt: tomorrow },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
    }),
    prisma.reservation.count({
      where: {
        ...(unitId ? { unitId } : {}),
        date: { gte: today, lt: tomorrow },
        status: 'CONFIRMED',
      },
    }),
    prisma.queueEntry.count({
      where: {
        ...(unitId ? { unitId } : {}),
        status: 'WAITING',
      },
    }),
    prisma.queueEntry.count({
      where: {
        ...(unitId ? { unitId } : {}),
        status: 'CALLED',
      },
    }),
    prisma.conversation.count({
      where: {
        ...(unitId ? { unitId } : {}),
        status: 'OPEN',
      },
    }),
    prisma.conversation.count({
      where: {
        ...(unitId ? { unitId } : {}),
        status: 'PENDING',
      },
    }),
    prisma.customer.count({
      where: {
        ...(unitId ? { unitId } : {}),
        active: true,
      },
    }),
    prisma.customer.count({
      where: {
        ...(unitId ? { unitId } : {}),
        segment: 'VIP',
        active: true,
      },
    }),
  ])

  return {
    reservationsToday,
    reservationsConfirmedToday,
    queueActive: queueWaiting + queueCalled,
    queueWaiting,
    queueCalled,
    openConversations,
    pendingConversations,
    totalConversationsActive: openConversations + pendingConversations,
    totalCustomers,
    vipCustomers,
  }
}

export async function getUpcomingReservations(unitId?: string, limit = 5) {
  const now = new Date()
  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  return prisma.reservation.findMany({
    where: {
      ...(unitId ? { unitId } : {}),
      date: { gte: now, lte: endOfDay },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    include: {
      customer: { include: { tags: true } },
    },
    orderBy: { date: 'asc' },
    take: limit,
  })
}

export async function getCurrentQueue(unitId?: string, limit = 8) {
  return prisma.queueEntry.findMany({
    where: {
      ...(unitId ? { unitId } : {}),
      status: { in: ['WAITING', 'CALLED'] },
    },
    include: {
      customer: true,
    },
    orderBy: [
      { status: 'asc' },
      { position: 'asc' },
      { createdAt: 'asc' },
    ],
    take: limit,
  })
}

export async function getOpenConversations(unitId?: string, limit = 5) {
  return prisma.conversation.findMany({
    where: {
      ...(unitId ? { unitId } : {}),
      status: { in: ['OPEN', 'PENDING'] },
    },
    include: {
      customer: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: 'desc' },
    take: limit,
  })
}

export async function getRecentActivity(unitId?: string, limit = 10) {
  return prisma.systemEvent.findMany({
    where: {
      ...(unitId ? { unitId } : {}),
    },
    orderBy: { occurredAt: 'desc' },
    take: limit,
  })
}
