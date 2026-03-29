import { prisma } from '@/lib/db'

export async function getIntegrations(unitId?: string) {
  return prisma.integration.findMany({
    where: unitId ? { unitId } : {},
    orderBy: { type: 'asc' },
  })
}

export async function getIntegrationByType(unitId: string, type: string) {
  return prisma.integration.findUnique({
    where: { unitId_type: { unitId, type } },
  })
}

export async function getWebhooks(unitId?: string) {
  return prisma.webhook.findMany({
    where: unitId ? { unitId } : {},
    include: { _count: { select: { logs: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getWebhookById(id: string) {
  return prisma.webhook.findUnique({
    where: { id },
    include: {
      logs: { orderBy: { createdAt: 'desc' }, take: 30 },
    },
  })
}

export async function getWebhookLogs(unitId?: string, limit = 50) {
  return prisma.webhookLog.findMany({
    where: unitId ? { webhook: { unitId } } : {},
    include: { webhook: { select: { id: true, name: true, url: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function getIntegrationStats(unitId?: string) {
  const wWhere = unitId ? { unitId } : {}
  const lWhere = unitId ? { webhook: { unitId } } : {}

  const [activeIntegrations, activeWebhooks, totalDeliveries, successDeliveries] = await Promise.all([
    prisma.integration.count({ where: { ...wWhere, active: true } }),
    prisma.webhook.count({ where: { ...wWhere, active: true } }),
    prisma.webhookLog.count({ where: lWhere }),
    prisma.webhookLog.count({ where: { ...lWhere, success: true } }),
  ])

  return { activeIntegrations, activeWebhooks, totalDeliveries, successDeliveries }
}
