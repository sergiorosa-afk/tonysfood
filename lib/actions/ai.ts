'use server'

import { auth } from '@/lib/auth'
import { getAIProvider } from '@/lib/ai/provider'
import { prisma } from '@/lib/db'

export async function getAISuggestedReplies(conversationId: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: { orderBy: { createdAt: 'asc' }, take: 10 },
      customer: true,
    },
  })
  if (!conversation) return { error: 'Conversa não encontrada' }

  const ai = getAIProvider()

  try {
    const suggestions = await ai.suggestReplies({
      guestName: conversation.customer?.name ?? conversation.guestName ?? null,
      messages: conversation.messages.map((m) => ({
        direction: m.direction,
        content: m.content,
      })),
      customerSegment: conversation.customer?.segment ?? null,
      preferences: (conversation.customer?.preferences as string[]) ?? [],
      restrictions: (conversation.customer?.restrictions as string[]) ?? [],
    })

    return { suggestions }
  } catch (err) {
    return { error: String(err) }
  }
}

export async function classifyMessageIntent(message: string) {
  const session = await auth()
  if (!session?.user) return null

  const ai = getAIProvider()
  try {
    return await ai.classifyIntent(message)
  } catch {
    return null
  }
}

export async function getAICustomerSummary(customerId: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      tags: true,
      reservations: true,
      conversations: { where: { status: { in: ['OPEN', 'PENDING'] } } },
    },
  })
  if (!customer) return { error: 'Cliente não encontrado' }

  const ai = getAIProvider()

  try {
    const summary = await ai.summarizeCustomer({
      name: customer.name,
      segment: customer.segment,
      visitCount: customer.visitCount,
      lastVisitAt: customer.lastVisitAt,
      tags: customer.tags.map((t) => t.tag),
      preferences: (customer.preferences as string[]) ?? [],
      restrictions: (customer.restrictions as string[]) ?? [],
      reservationCount: customer.reservations.length,
      noShowCount: customer.reservations.filter((r) => r.status === 'NO_SHOW').length,
      openConversations: customer.conversations.length,
    })
    return { summary }
  } catch (err) {
    return { error: String(err) }
  }
}
