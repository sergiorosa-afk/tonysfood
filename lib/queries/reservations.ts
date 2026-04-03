import { prisma } from '@/lib/db'

export type ReservationFilters = {
  unitId?: string
  date?: 'today' | 'tomorrow' | 'week' | 'all'
  status?: string
  channel?: string
  q?: string
}

function getDateRange(date: ReservationFilters['date']) {
  // Railway roda em UTC. Datas são salvas como UTC puro (sem offset).
  // Filtro usa meia-noite UTC de cada dia para corresponder ao que foi armazenado.
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  const d = now.getUTCDate()

  if (date === 'today') {
    return {
      gte: new Date(Date.UTC(y, m, d)),
      lt:  new Date(Date.UTC(y, m, d + 1)),
    }
  }
  if (date === 'tomorrow') {
    return {
      gte: new Date(Date.UTC(y, m, d + 1)),
      lt:  new Date(Date.UTC(y, m, d + 2)),
    }
  }
  if (date === 'week') {
    return {
      gte: new Date(Date.UTC(y, m, d)),
      lt:  new Date(Date.UTC(y, m, d + 7)),
    }
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
