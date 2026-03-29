import { prisma } from '@/lib/db'

export async function getSegments() {
  return prisma.segment.findMany({ orderBy: { order: 'asc' } })
}

export async function getSegmentByName(name: string) {
  return prisma.segment.findUnique({ where: { name } })
}
