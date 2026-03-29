import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const defaults = [
    { name: 'VIP',      label: 'VIP',     color: 'amber',  order: 0 },
    { name: 'REGULAR',  label: 'Regular', color: 'blue',   order: 1 },
    { name: 'NEW',      label: 'Novo',    color: 'green',  order: 2 },
    { name: 'INACTIVE', label: 'Inativo', color: 'slate',  order: 3 },
  ]
  for (const seg of defaults) {
    await prisma.segment.upsert({
      where: { name: seg.name },
      update: {},
      create: seg,
    })
  }
  console.log('Segments seeded.')
  await prisma.$disconnect()
}
main()
