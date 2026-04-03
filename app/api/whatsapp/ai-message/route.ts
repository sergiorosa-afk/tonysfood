import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { processWithGemini, CollectedData, HistoryMessage } from '@/lib/ai/gemini-reservation'
import { normalizePhone, phoneVariants } from '@/lib/utils/phone'

export const dynamic = 'force-dynamic'

const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutos

// Prisma exige cast para campos Json — não aceita tipos customizados diretamente
function toJson(v: unknown) {
  return v as any // eslint-disable-line @typescript-eslint/no-explicit-any
}

export async function POST(req: NextRequest) {
  // Proteção: apenas o worker interno pode chamar este endpoint
  const secret = req.headers.get('x-worker-secret')
  if (!secret || secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.unitId || !body?.phone || !body?.message) {
    return NextResponse.json({ reply: null })
  }

  const { unitId, phone, message } = body as {
    unitId: string
    phone: string
    message: string
  }

  try {
    const normalizedPhone = normalizePhone(phone)
    const variants = phoneVariants(phone)

    // Busca sessão ativa de IA para este telefone
    let aiConv = await prisma.aiConversation.findFirst({
      where: {
        unitId,
        phone: { in: variants },
        status: 'ACTIVE',
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Sessão expirada → encerra e cria nova
    if (aiConv && new Date() > aiConv.expiresAt) {
      await prisma.aiConversation.update({
        where: { id: aiConv.id },
        data: { status: 'EXPIRED' },
      })
      aiConv = null
    }

    const emptyCollected: CollectedData = {
      name: null,
      date: null,
      time: null,
      partySize: null,
      notes: null,
    }

    // Sem sessão ativa → inicia nova
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

    const history = aiConv.history as HistoryMessage[]
    const collected = aiConv.collected as CollectedData

    // Chama Gemini
    const gemini = await processWithGemini(history, message, collected)

    // Atualiza histórico
    const newHistory: HistoryMessage[] = [
      ...history,
      { role: 'user', content: message },
      { role: 'model', content: gemini.reply },
    ]

    let finalReply = gemini.reply

    if (gemini.cancelled) {
      // Cliente não quer reserva
      await prisma.aiConversation.update({
        where: { id: aiConv.id },
        data: {
          status: 'EXPIRED',
          history: toJson(newHistory),
          collected: toJson(gemini.collected),
        },
      })
    } else if (gemini.readyToBook) {
      // Todos os dados coletados e confirmados — cria a reserva
      const { name, date, time, partySize, notes } = gemini.collected

      if (name && date && time && partySize) {
        try {
          const [year, month, day] = date.split('-').map(Number)
          const [hour, minute] = time.split(':').map(Number)
          const reservationDate = new Date(year, month - 1, day, hour, minute)

          // Busca ou cria o cliente
          let customer = await prisma.customer.findFirst({
            where: { unitId, phone: { in: variants } },
          })

          if (!customer) {
            customer = await prisma.customer.create({
              data: {
                unitId,
                name,
                phone: normalizedPhone,
                segment: 'NEW',
              },
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
            data: {
              status: 'COMPLETED',
              history: toJson(newHistory),
              collected: toJson(gemini.collected),
            },
          })
        } catch (err) {
          console.error('[AI Reservation] Erro ao criar reserva:', err)
          finalReply =
            'Desculpe, ocorreu um problema ao registrar sua reserva. Por favor, tente novamente ou entre em contato conosco.'
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
      // Conversa em andamento
      await prisma.aiConversation.update({
        where: { id: aiConv.id },
        data: {
          history: toJson(newHistory),
          collected: toJson(gemini.collected),
          expiresAt: new Date(Date.now() + SESSION_TIMEOUT_MS),
        },
      })
    }

    // Salva resposta da IA como mensagem OUTBOUND na conversa do Inbox
    try {
      const conversation = await prisma.conversation.findFirst({
        where: {
          unitId,
          guestPhone: { in: variants },
          status: { in: ['OPEN', 'PENDING'] },
        },
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
      console.error('[AI Reservation] Erro ao salvar mensagem outbound:', err)
    }

    return NextResponse.json({ reply: finalReply })
  } catch (err) {
    console.error('[AI Reservation] Erro geral:', err)
    return NextResponse.json({ reply: null })
  }
}
