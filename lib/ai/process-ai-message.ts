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
      console.log('[AI] readyToBook — dados:', JSON.stringify({ name, date, time, partySize }))

      if (name && date && time && partySize) {
        let reservationCreated = false

        // 1. Cria a reserva (operação principal)
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
          console.log('[AI] Reserva criada:', reservation.id)
          reservationCreated = true

          // Histórico de status (não-crítico)
          prisma.reservationStatusHistory.create({
            data: {
              reservationId: reservation.id,
              status: 'PENDING',
              notes: 'Reserva criada pelo assistente virtual via WhatsApp',
            },
          }).catch((e) => console.error('[AI] Erro ao criar statusHistory:', e))
        } catch (err) {
          console.error('[AI] Erro ao criar reserva:', err)
          finalReply = 'Desculpe, ocorreu um problema ao registrar sua reserva. Por favor, tente novamente em instantes.'
        }

        // 2. Atualiza sessão (operação separada — não afeta o reply ao cliente)
        try {
          await prisma.aiConversation.update({
            where: { id: aiConv.id },
            data: {
              status: reservationCreated ? 'COMPLETED' : 'ACTIVE',
              history: toJson(newHistory),
              collected: toJson(gemini.collected),
              expiresAt: reservationCreated ? aiConv.expiresAt : new Date(Date.now() + SESSION_TIMEOUT_MS),
            },
          })
        } catch (err) {
          console.error('[AI] Erro ao atualizar sessão:', err)
        }
      } else {
        console.error('[AI] readyToBook mas dados incompletos:', JSON.stringify(gemini.collected))
        // Mantém sessão ativa para tentar novamente
        try {
          await prisma.aiConversation.update({
            where: { id: aiConv.id },
            data: {
              history: toJson(newHistory),
              collected: toJson(gemini.collected),
              expiresAt: new Date(Date.now() + SESSION_TIMEOUT_MS),
            },
          })
        } catch (err) {
          console.error('[AI] Erro ao manter sessão ativa:', err)
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

    // Inbox é salvo pelo worker APÓS confirmação de envio WhatsApp
    return finalReply
  } catch (err) {
    console.error('[AI] Erro geral:', err)
    return null
  }
}
