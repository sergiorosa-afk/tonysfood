import { prisma } from '@/lib/db'

export async function getUsers(unitId?: string) {
  return prisma.user.findMany({
    where: unitId ? { unitId } : {},
    include: { unit: { select: { id: true, name: true } } },
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
  })
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { unit: true },
  })
}

export async function getUnits() {
  return prisma.unit.findMany({
    include: {
      _count: {
        select: { users: true, customers: true, reservations: true },
      },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getUnitById(id: string) {
  return prisma.unit.findUnique({
    where: { id },
    include: {
      _count: { select: { users: true, customers: true, reservations: true } },
    },
  })
}

export async function getAdminStats() {
  const [users, activeUsers, units, customers, catalogItems, automations, webhooks] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { active: true } }),
    prisma.unit.count(),
    prisma.customer.count(),
    prisma.catalogItem.count({ where: { active: true } }),
    prisma.automationRule.count({ where: { active: true } }),
    prisma.webhook.count({ where: { active: true } }),
  ])
  return { users, activeUsers, units, customers, catalogItems, automations, webhooks }
}
