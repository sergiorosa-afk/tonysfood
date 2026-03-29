import { prisma } from '@/lib/db'

export type ReservationFilters = {
  unitId?: string
  date?: 'today' | 'tomorrow' | 'week' | 'all'
  status?: string
  channel?: string
  q?: string
}

function getDateRange(date: ReservationFilters['date']) {
  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)

  if (date === 'today') {
    const end = new Date(startOfDay)
    end.setDate(end.getDate() + 1)
    return { gte: startOfDay, lt: end }
  }
  if (date === 'tomorrow') {
    const start = new Date(startOfDay)
    start.setDate(start.getDate() + 1)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return { gte: start, lt: end }
  }
  if (date === 'week') {
    const end = new Date(startOfDay)
    end.setDate(end.getDate() + 7)
    return { gte: startOfDay, lt: end }
  }
  return undefined
}

export async function getReservations(filters: ReservationFilters = {}) {
  const { unitId, date = 'today', status, channel, q } = filters
  const dateRange = getDateRange(date)

  return prisma.reservation.findMany({
    where: {
      ...(unitId ? { unitId } : {}),
      ...(dateRange ? { date: dateRange } : {}),
      ...(status && status !== 'all' ? { status } : {}),
      ...(channel && channel !== 'all' ? { channel } : {}),
      ...(q ? { guestName: { contains: q } } : {}),
    },
    include: {
      customer: { include: { tags: true } },
      statusHistory: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { date: 'asc' },
  })
}

export async function getReservationById(id: string) {
  return prisma.reservation.findUnique({
    where: { id },
    include: {
      customer: { include: { tags: true } },
      unit: true,
      statusHistory: { orderBy: { createdAt: 'desc' } },
    },
  })
}

export async function getReservationCounts(unitId?: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [total, confirmed, pending, checkedIn] = await Promise.all([
    prisma.reservation.count({
      where: { ...(unitId ? { unitId } : {}), date: { gte: today, lt: tomorrow } },
    }),
    prisma.reservation.count({
      where: { ...(unitId ? { unitId } : {}), date: { gte: today, lt: tomorrow }, status: 'CONFIRMED' },
    }),
    prisma.reservation.count({
      where: { ...(unitId ? { unitId } : {}), date: { gte: today, lt: tomorrow }, status: 'PENDING' },
    }),
    prisma.reservation.count({
      where: { ...(unitId ? { unitId } : {}), date: { gte: today, lt: tomorrow }, status: 'CHECKED_IN' },
    }),
  ])

  return { total, confirmed, pending, checkedIn }
}
