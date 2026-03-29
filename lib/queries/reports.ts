import { prisma } from '@/lib/db'

function sinceDate(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

function groupByDay(items: { createdAt: Date }[], days: number) {
  const map = new Map<string, number>()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    map.set(d.toISOString().slice(0, 10), 0)
  }
  for (const item of items) {
    const key = item.createdAt.toISOString().slice(0, 10)
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1)
  }
  return Array.from(map.entries()).map(([date, count]) => ({ date, count }))
}

// ─── Ocupação da Fila ──────────────────────────────────────────────────────

export async function getQueueReport(unitId: string, days: number) {
  const entries = await prisma.queueEntry.findMany({
    where: { unitId, createdAt: { gte: sinceDate(days) } },
    select: { status: true, estimatedWait: true, partySize: true, createdAt: true },
  })

  const total       = entries.length
  const abandoned   = entries.filter(e => e.status === 'ABANDONED').length
  const seated      = entries.filter(e => e.status === 'SEATED').length
  const called      = entries.filter(e => e.status === 'CALLED').length
  const waiting     = entries.filter(e => e.status === 'WAITING').length
  const abandonment = total > 0 ? Math.round((abandoned / total) * 100) : 0
  const avgWait     = total > 0
    ? Math.round(entries.reduce((s, e) => s + (e.estimatedWait ?? 0), 0) / total)
    : 0
  const totalPeople = entries.reduce((s, e) => s + (e.partySize ?? 1), 0)
  const byDay       = groupByDay(entries, days)

  return { total, abandoned, seated, called, waiting, abandonment, avgWait, totalPeople, byDay }
}

// ─── Reservas por Período ─────────────────────────────────────────────────

export async function getReservationReport(unitId: string, days: number) {
  const reservations = await prisma.reservation.findMany({
    where: { unitId, createdAt: { gte: sinceDate(days) } },
    select: { status: true, channel: true, partySize: true, createdAt: true },
  })

  const total      = reservations.length
  const confirmed  = reservations.filter(r => r.status === 'CONFIRMED').length
  const cancelled  = reservations.filter(r => r.status === 'CANCELLED').length
  const pending    = reservations.filter(r => r.status === 'PENDING').length
  const checkedIn  = reservations.filter(r => r.status === 'CHECKIN').length
  const cancelRate = total > 0 ? Math.round((cancelled / total) * 100) : 0
  const avgParty   = total > 0
    ? Math.round(reservations.reduce((s, r) => s + (r.partySize ?? 2), 0) / total * 10) / 10
    : 0

  // Por canal
  const channelMap = new Map<string, number>()
  for (const r of reservations) {
    const ch = r.channel ?? 'outro'
    channelMap.set(ch, (channelMap.get(ch) ?? 0) + 1)
  }
  const byChannel = Array.from(channelMap.entries())
    .map(([channel, count]) => ({ channel, count }))
    .sort((a, b) => b.count - a.count)

  const byDay = groupByDay(reservations, days)

  return { total, confirmed, cancelled, pending, checkedIn, cancelRate, avgParty, byChannel, byDay }
}

// ─── Clientes por Segmento / VIP ──────────────────────────────────────────

export async function getCustomerSegmentReport(unitId: string) {
  const [bySegmentRaw, vipCustomers, totalCustomers, newThisMonth] = await Promise.all([
    prisma.customer.groupBy({
      by: ['segment'],
      where: { unitId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.customer.findMany({
      where: { unitId, segment: 'VIP' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: { select: { queueEntries: true, reservations: true } },
      },
      orderBy: [{ queueEntries: { _count: 'desc' } }],
      take: 10,
    }),
    prisma.customer.count({ where: { unitId } }),
    prisma.customer.count({ where: { unitId, createdAt: { gte: sinceDate(30) } } }),
  ])

  const bySegment = bySegmentRaw.map(s => ({
    segment: s.segment ?? 'Sem segmento',
    count: s._count.id,
    pct: totalCustomers > 0 ? Math.round((s._count.id / totalCustomers) * 100) : 0,
  }))

  return { bySegment, vipCustomers, totalCustomers, newThisMonth }
}
