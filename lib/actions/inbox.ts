'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { emitEvent } from '@/lib/events'
import { getWaWebStateForUnit, sendWaWebMessage } from '@/lib/whatsapp-web/service'

export async function sendMessage(conversationId: string, content: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  const trimmed = content.trim()
  if (!trimmed) return { error: 'Mensagem vazia' }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  })
  if (!conversation) return { error: 'Conversa não encontrada' }

  await prisma.message.create({
    data: {
      conversationId,
      content: trimmed,
      direction: 'OUTBOUND',
      senderName: (session.user as any).name ?? 'Atendente',
    },
  })

  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: new Date(),
      status: conversation.status === 'RESOLVED' || conversation.status === 'CLOSED'
        ? 'OPEN'
        : conversation.status,
    },
  })

  // Send via WhatsApp Web if connected
  const waState = getWaWebStateForUnit(conversation.unitId)
  if (waState.status === 'connected' && conversation.guestPhone) {
    sendWaWebMessage(conversation.unitId, conversation.guestPhone, trimmed)
  }

  revalidatePath(`/inbox/${conversationId}`)
  revalidatePath('/inbox')
  return { success: true }
}

export async function resolveConversation(id: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  await prisma.conversation.update({
    where: { id },
    data: { status: 'RESOLVED' },
  })

  revalidatePath(`/inbox/${id}`)
  revalidatePath('/inbox')
}

export async function closeConversation(id: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  await prisma.conversation.update({
    where: { id },
    data: { status: 'CLOSED', closedAt: new Date() },
  })

  revalidatePath(`/inbox/${id}`)
  revalidatePath('/inbox')
}

export async function reopenConversation(id: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  await prisma.conversation.update({
    where: { id },
    data: { status: 'OPEN', closedAt: null },
  })

  revalidatePath(`/inbox/${id}`)
  revalidatePath('/inbox')
}

export async function markPending(id: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  await prisma.conversation.update({
    where: { id },
    data: { status: 'PENDING' },
  })

  revalidatePath(`/inbox/${id}`)
  revalidatePath('/inbox')
}

export async function assignConversation(id: string, assignedTo: string | null) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  await prisma.conversation.update({
    where: { id },
    data: { assignedTo },
  })

  revalidatePath(`/inbox/${id}`)
  revalidatePath('/inbox')
}

export async function linkCustomerToConversation(
  conversationId: string,
  customerId: string
) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  const customer = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!customer) return { error: 'Cliente não encontrado' }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { customerId, guestName: customer.name },
  })

  await emitEvent({
    unitId: customer.unitId,
    eventType: 'CONVERSATION_LINKED',
    entityType: 'conversation',
    entityId: conversationId,
    payload: { customerId, customerName: customer.name },
  })

  revalidatePath(`/inbox/${conversationId}`)
  revalidatePath('/inbox')
  return { success: true }
}

export async function createOutboundConversation(
  unitId: string,
  guestPhone: string,
  guestName: string,
  firstMessage: string
) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  const conversation = await prisma.conversation.create({
    data: {
      unitId,
      guestPhone,
      guestName,
      status: 'OPEN',
      channel: 'whatsapp',
      lastMessageAt: new Date(),
      messages: {
        create: {
          content: firstMessage,
          direction: 'OUTBOUND',
          senderName: (session.user as any).name ?? 'Atendente',
        },
      },
    },
  })

  revalidatePath('/inbox')
  return { success: true, id: conversation.id }
}
