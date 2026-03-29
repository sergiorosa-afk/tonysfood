'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function openOrCreateConversation(customerId: string) {
  const session = await auth()
  if (!session) throw new Error('Não autorizado')
  const unitId = (session.user as any)?.unitId as string

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, name: true, phone: true, unitId: true },
  })
  if (!customer || customer.unitId !== unitId) throw new Error('Cliente não encontrado')
  if (!customer.phone) throw new Error('Cliente sem telefone cadastrado')

  // Reuse existing open/pending conversation if exists
  const existing = await prisma.conversation.findFirst({
    where: {
      unitId,
      customerId,
      status: { in: ['OPEN', 'PENDING'] },
    },
    orderBy: { lastMessageAt: 'desc' },
  })

  if (existing) {
    redirect(`/inbox/${existing.id}`)
  }

  // Create new conversation
  const conv = await prisma.conversation.create({
    data: {
      unitId,
      customerId,
      guestName: customer.name,
      guestPhone: customer.phone,
      channel: 'whatsapp',
      status: 'OPEN',
    },
  })

  revalidatePath('/inbox')
  redirect(`/inbox/${conv.id}`)
}

export async function searchCustomersForInbox(q: string) {
  const session = await auth()
  if (!session) return []
  const unitId = (session.user as any)?.unitId as string

  if (!q || q.trim().length < 2) return []

  return prisma.customer.findMany({
    where: {
      unitId,
      active: true,
      phone: { not: null },
      OR: [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
      ],
    },
    select: { id: true, name: true, phone: true, email: true, segment: true },
    take: 8,
    orderBy: { name: 'asc' },
  })
}
