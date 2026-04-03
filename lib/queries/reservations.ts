import { prisma } from '@/lib/db'

export type ReservationFilters = {
  unitId?: string
  date?: 'today' | 'tomorrow' | 'week' | 'all'
  status?: string
  channel?: string
  q?: string
}

function getDateRange(date: ReservationFilters['date']) {
  // Railway roda em UTC; Brasil é UTC-3 (sem horário de verão desde 2019).
  // Computamos sempre relativo ao horário de Brasília para que "Hoje" e
  // "Amanhã" correspondam ao dia local do restaurante.
  const BR_OFFSET_MS = 3 * 60 * 60 * 1000 // 3h em ms

  // Hora atual deslocada para o fuso de Brasília
  const nowBR = new Date(Date.now() - BR_OFFSET_MS)

  // Meia-noite do dia atual em Brasília
  const startBR = new Date(nowBR)
  startBR.setUTCHours(0, 0, 0, 0)

  // Converte de volta para UTC para a query no banco
  const startDay = new Date(startBR.getTime() + BR_OFFSET_MS)
  const DAY_MS   = 86_400_000

  if (date === 'today') {
    return { gte: startDay, lt: new Date(startDay.getTime() + DAY_MS) }
  }
  if (date === 'tomorrow') {
    const start = new Date(startDay.getTime() + DAY_MS)
    return { gte: start, lt: new Date(start.getTime() + DAY_MS) }
  }
  if (date === 'week') {
    return { gte: startDay, lt: new Date(startDay.getTime() + 7 * DAY_MS) }
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
