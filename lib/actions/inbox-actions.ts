'use server'

import { auth } from '@/lib/auth'
import { getConversations, getInboxStats } from '@/lib/queries/inbox'

export async function fetchInboxData(status?: string, q?: string) {
  const session = await auth()
  const unitId = (session?.user as any)?.unitId

  const [conversations, stats] = await Promise.all([
    getConversations({ unitId, status, q }),
    getInboxStats(unitId),
  ])

  // Serializa datas para JSON (server actions convertem automaticamente)
  return {
    conversations: conversations.map((c) => ({
      id: c.id,
      guestName: c.guestName,
      guestPhone: c.guestPhone,
      status: c.status,
      lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      customer: c.customer
        ? { name: c.customer.name, segment: c.customer.segment }
        : null,
      lastMessage: c.messages[0]
        ? { content: c.messages[0].content, direction: c.messages[0].direction }
        : null,
    })),
    stats,
  }
}
