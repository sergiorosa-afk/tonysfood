import { prisma } from '@/lib/db'

export async function getAutomationRules(unitId?: string) {
  return prisma.automationRule.findMany({
    where: unitId ? { unitId } : {},
    include: {
      _count: { select: { logs: true } },
    },
    orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
  })
}

export async function getAutomationRuleById(id: string) {
  return prisma.automationRule.findUnique({
    where: { id },
    include: {
      logs: {
        orderBy: { executedAt: 'desc' },
        take: 20,
      },
    },
  })
}

export async function getMessageTemplates(unitId?: string) {
  return prisma.messageTemplate.findMany({
    where: unitId ? { unitId } : {},
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })
}

export async function getMessageTemplateById(id: string) {
  return prisma.messageTemplate.findUnique({ where: { id } })
}

export async function getAutomationLogs(unitId?: string, limit = 50) {
  return prisma.automationLog.findMany({
    where: unitId
      ? { rule: { unitId } }
      : {},
    include: {
      rule: { select: { id: true, name: true, triggerEvent: true } },
    },
    orderBy: { executedAt: 'desc' },
    take: limit,
  })
}

export async function getAutomationStats(unitId?: string) {
  const where = unitId ? { rule: { unitId } } : {}

  const [total, success, failed, skipped, rules, templates] = await Promise.all([
    prisma.automationLog.count({ where }),
    prisma.automationLog.count({ where: { ...where, status: 'SUCCESS' } }),
    prisma.automationLog.count({ where: { ...where, status: { in: ['FAILED', 'PARTIAL'] } } }),
    prisma.automationLog.count({ where: { ...where, status: 'SKIPPED' } }),
    prisma.automationRule.count({ where: unitId ? { unitId, active: true } : { active: true } }),
    prisma.messageTemplate.count({ where: unitId ? { unitId, active: true } : { active: true } }),
  ])

  return { total, success, failed, skipped, activeRules: rules, activeTemplates: templates }
}
