/**
 * Lógica de processamento AI reutilizável — chamada pelo service.ts via IPC.
 * Mantém sessão de conversa no banco e cria reserva quando confirmado.
 */

import { prisma } from '@/lib/db'
import { processWithGemini, CollectedData, HistoryMessage } from './gemini-reservation'
import { normalizePhone, phoneVariants } from '@/lib/utils/phone'

const SESSION_TIMEOUT_MS = 30 * 60 * 1000

function toJson(v: unknown) {
  return v as any // eslint-disable-line @typescript-eslint/no-explicit-any
}

export async function processAiMessage(
  unitId: string,
  phone: string,
  message: string,
): Promise<string | null> {
  try {
    const normalizedPhone = normalizePhone(phone)
    const variants = phoneVariants(phone)

    // Busca sessão ativa
    let aiConv = await prisma.aiConversation.findFirst({
      where: { unitId, phone: { in: variants }, status: 'ACTIVE' },
      orderBy: { updatedAt: 'desc' },
    })

    // Expira sessão antiga
    if (aiConv && new Date() > aiConv.expiresAt) {
      await prisma.aiConversation.update({ where: { id: aiConv.id }, data: { status: 'EXPIRED' } })
      aiConv = null
    }

    const emptyCollected: CollectedData = { name: null, date: null, time: null, partySize: null, notes: null }

    if (!aiConv) {
      aiConv = await prisma.aiConversation.create({
        data: {
          unitId,
          phone: normalizedPhone,
          status: 'ACTIVE',
          history: toJson([]),
          collected: toJson(emptyCollected),
          expiresAt: new Date(Date.now() + SESSION_TIMEOUT_MS),
        },
      })
    }

    const history = aiConv.history as unknown as HistoryMessage[]
    const collected = aiConv.collected as unknown as CollectedData

    const gemini = await processWithGemini(history, message, collected)

    const newHistory: HistoryMessage[] = [
      ...history,
      { role: 'user', content: message },
      { role: 'model', content: gemini.reply },
    ]

    let finalReply = gemini.reply

    if (gemini.cancelled) {
      await prisma.aiConversation.update({
        where: { id: aiConv.id },
        data: { status: 'EXPIRED', history: toJson(newHistory), collected: toJson(gemini.collected) },
      })
    } else if (gemini.readyToBook) {
      const { name, date, time, partySize, notes } = gemini.collected

      if (name && date && time && partySize) {
        try {
          const [year, month, day] = date.split('-').map(Number)
          const [hour, minute] = time.split(':').map(Number)
          const reservationDate = new Date(year, month - 1, day, hour, minute)

          let customer = await prisma.customer.findFirst({ where: { unitId, phone: { in: variants } } })

          if (!customer) {
            customer = await prisma.customer.create({
              data: { unitId, name, phone: normalizedPhone, segment: 'NEW' },
            })
          }

          const reservation = await prisma.reservation.create({
            data: {
              unitId,
              customerId: customer.id,
              guestName: name,
              guestPhone: normalizedPhone,
              date: reservationDate,
              partySize,
              status: 'PENDING',
              channel: 'WHATSAPP',
              notes: notes ?? null,
            },
          })

          await prisma.reservationStatusHistory.create({
            data: {
              reservationId: reservation.id,
              status: 'PENDING',
              notes: 'Reserva criada pelo assistente virtual via WhatsApp',
            },
          })

          await prisma.aiConversation.update({
            where: { id: aiConv.id },
            data: { status: 'COMPLETED', history: toJson(newHistory), collected: toJson(gemini.collected) },
          })
        } catch (err) {
          console.error('[AI] Erro ao criar reserva:', err)
          finalReply = 'Desculpe, ocorreu um problema ao registrar sua reserva. Por favor, tente novamente.'
          await prisma.aiConversation.update({
            where: { id: aiConv.id },
            data: {
              history: toJson(newHistory),
              collected: toJson(gemini.collected),
              expiresAt: new Date(Date.now() + SESSION_TIMEOUT_MS),
            },
          })
        }
      }
    } else {
      await prisma.aiConversation.update({
        where: { id: aiConv.id },
        data: {
          history: toJson(newHistory),
          collected: toJson(gemini.collected),
          expiresAt: new Date(Date.now() + SESSION_TIMEOUT_MS),
        },
      })
    }

    // Salva resposta no Inbox
    try {
      const conversation = await prisma.conversation.findFirst({
        where: { unitId, guestPhone: { in: variants }, status: { in: ['OPEN', 'PENDING'] } },
        orderBy: { lastMessageAt: 'desc' },
      })
      if (conversation) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            content: finalReply,
            direction: 'OUTBOUND',
            senderName: "Tony's Food IA",
          },
        })
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: new Date() },
        })
      }
    } catch (err) {
      console.error('[AI] Erro ao salvar mensagem outbound:', err)
    }

    return finalReply
  } catch (err) {
    console.error('[AI] Erro geral:', err)
    return null
  }
}
