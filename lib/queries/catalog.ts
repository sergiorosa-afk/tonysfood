import { prisma } from '@/lib/db'

export type CatalogFilters = {
  unitId?: string
  category?: string
  tag?: string
  active?: boolean
  featured?: boolean
  q?: string
}

export async function getCatalogItems(filters: CatalogFilters = {}) {
  const { unitId, category, active, featured, q } = filters

  const items = await prisma.catalogItem.findMany({
    where: {
      ...(unitId ? { unitId } : {}),
      ...(category && category !== 'all' ? { category } : {}),
      ...(active !== undefined ? { active } : {}),
      ...(featured !== undefined ? { featured } : {}),
      ...(q ? { name: { contains: q } } : {}),
    },
    orderBy: [{ featured: 'desc' }, { category: 'asc' }, { name: 'asc' }],
  })

  // Filter by tag in memory (JSON column)
  if (filters.tag && filters.tag !== 'all') {
    return items.filter((item) => {
      const tags = item.tags as string[] | null
      return tags && tags.includes(filters.tag!)
    })
  }

  return items
}

export async function getCatalogItemById(id: string) {
  return prisma.catalogItem.findUnique({
    where: { id },
    include: { unit: true },
  })
}

export async function getCatalogCategories(unitId?: string) {
  const items = await prisma.catalogItem.findMany({
    where: unitId ? { unitId } : {},
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  })
  return items.map((i) => i.category)
}

export async function getCatalogStats(unitId?: string) {
  const where = unitId ? { unitId } : {}

  const [total, active, featured, categories] = await Promise.all([
    prisma.catalogItem.count({ where }),
    prisma.catalogItem.count({ where: { ...where, active: true } }),
    prisma.catalogItem.count({ where: { ...where, featured: true } }),
    prisma.catalogItem.groupBy({
      by: ['category'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
  ])

  return { total, active, inactive: total - active, featured, categories }
}

export async function getSuggestions(
  preferences: string[],
  restrictions: string[],
  unitId?: string
) {
  const items = await prisma.catalogItem.findMany({
    where: {
      ...(unitId ? { unitId } : {}),
      active: true,
    },
  })

  return items
    .map((item) => {
      const tags = (item.tags as string[]) || []
      const allergens = (item.allergens as string[]) || []

      // Discard items with allergens that match restrictions
      const hasRestriction = restrictions.some((r) =>
        allergens.some((a) => a.toLowerCase().includes(r.toLowerCase()))
      )
      if (hasRestriction) return null

      // Score based on preference matches
      const score = preferences.filter((p) =>
        tags.some((t) => t.toLowerCase().includes(p.toLowerCase()))
      ).length

      return { ...item, score }
    })
    .filter(Boolean)
    .sort((a, b) => (b!.score - a!.score))
    .slice(0, 6) as (typeof items[0] & { score: number })[]
}
