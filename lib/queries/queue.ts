import { prisma } from '@/lib/db'

export async function getQueueEntries(unitId?: string) {
  return prisma.queueEntry.findMany({
    where: {
      ...(unitId ? { unitId } : {}),
      status: { in: ['WAITING', 'CALLED'] },
    },
    include: { customer: true },
    orderBy: [
      { status: 'asc' },
      { position: 'asc' },
      { createdAt: 'asc' },
    ],
  })
}

export async function getQueueHistory(unitId?: string, limit = 20) {
  return prisma.queueEntry.findMany({
    where: {
      ...(unitId ? { unitId } : {}),
      status: { in: ['SEATED', 'ABANDONED', 'TRANSFERRED'] },
    },
    include: { customer: true },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  })
}

export async function getQueueStats(unitId?: string) {
  const [waiting, called, seated, abandoned, avgWait] = await Promise.all([
    prisma.queueEntry.count({ where: { ...(unitId ? { unitId } : {}), status: 'WAITING' } }),
    prisma.queueEntry.count({ where: { ...(unitId ? { unitId } : {}), status: 'CALLED' } }),
    prisma.queueEntry.count({ where: { ...(unitId ? { unitId } : {}), status: 'SEATED' } }),
    prisma.queueEntry.count({ where: { ...(unitId ? { unitId } : {}), status: 'ABANDONED' } }),
    prisma.queueEntry.aggregate({
      where: { ...(unitId ? { unitId } : {}), status: 'WAITING' },
      _avg: { estimatedWait: true },
    }),
  ])

  return {
    waiting,
    called,
    seated,
    abandoned,
    avgEstimatedWait: Math.round(avgWait._avg.estimatedWait ?? 0),
  }
}

export async function getNextPosition(unitId: string) {
  const last = await prisma.queueEntry.findFirst({
    where: { unitId, status: { in: ['WAITING', 'CALLED'] } },
    orderBy: { position: 'desc' },
  })
  return (last?.position ?? 0) + 1
}
