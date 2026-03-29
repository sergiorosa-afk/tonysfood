import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySignature } from '@/lib/utils/hmac'
import { emitEvent } from '@/lib/events'

// ─── GET — WhatsApp webhook verification challenge ─────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode !== 'subscribe' || !token) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Find integration with matching verifyToken
  const integrations = await prisma.integration.findMany({
    where: { type: 'whatsapp', active: true },
  })

  const match = integrations.find((i) => {
    const cfg = i.config as Record<string, string>
    return cfg.verifyToken === token
  })

  if (!match) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return new NextResponse(challenge, { status: 200 })
}

// ─── POST — Receive incoming WhatsApp messages ─────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // HMAC verification (optional — only if webhookSecret is configured)
  const signature = req.headers.get('x-hub-signature-256') ?? ''

  let body: Record<string, unknown>
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body.object !== 'whatsapp_business_account') {
    return NextResponse.json({ status: 'ignored' })
  }

  const entries = (body.entry as any[]) ?? []

  for (const entry of entries) {
    const changes = (entry.changes as any[]) ?? []

    for (const change of changes) {
      if (change.field !== 'messages') continue

      const value = change.value as any
      const phoneNumberId = value?.metadata?.phone_number_id

      // Find the integration for this phone number
      const integrations = await prisma.integration.findMany({
        where: { type: 'whatsapp', active: true },
      })

      const integration = integrations.find((i) => {
        const cfg = i.config as Record<string, string>
        return cfg.phoneNumberId === phoneNumberId
      })

      if (!integration) continue

      // Verify HMAC if secret is configured
      const cfg = integration.config as Record<string, string>
      if (cfg.webhookSecret && signature) {
        const valid = verifySignature(cfg.webhookSecret, rawBody, signature)
        if (!valid) {
          console.warn('[WhatsApp] Invalid HMAC signature')
          continue
        }
      }

      const contacts = (value?.contacts as any[]) ?? []
      const messages = (value?.messages as any[]) ?? []

      for (const msg of messages) {
        if (msg.type !== 'text') continue

        const fromPhone = msg.from as string
        const msgText = msg.text?.body as string
        const contactName = contacts.find((c: any) => c.wa_id === fromPhone)?.profile?.name ?? null

        await handleInboundMessage({
          unitId: integration.unitId,
          phone: fromPhone,
          name: contactName,
          text: msgText,
          whatsappMsgId: msg.id,
        })
      }
    }
  }

  return NextResponse.json({ status: 'ok' })
}

// ─── Helper ────────────────────────────────────────────────────────────────

async function handleInboundMessage({
  unitId,
  phone,
  name,
  text,
  whatsappMsgId,
}: {
  unitId: string
  phone: string
  name: string | null
  text: string
  whatsappMsgId: string
}) {
  // Find or link to customer
  const customer = await prisma.customer.findFirst({
    where: { unitId, phone },
  })

  // Find an open/pending conversation for this phone
  let conversation = await prisma.conversation.findFirst({
    where: {
      unitId,
      guestPhone: phone,
      status: { in: ['OPEN', 'PENDING'] },
    },
    orderBy: { createdAt: 'desc' },
  })

  const isNew = !conversation

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        unitId,
        guestPhone: phone,
        guestName: name ?? customer?.name ?? null,
        customerId: customer?.id ?? null,
        status: 'OPEN',
        channel: 'whatsapp',
        lastMessageAt: new Date(),
      },
    })
  } else {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date(), status: 'OPEN' },
    })
  }

  // Check for duplicate message (idempotency)
  const existing = await prisma.message.findFirst({
    where: { conversationId: conversation.id, content: text,
      createdAt: { gte: new Date(Date.now() - 5000) } },
  })
  if (existing) return

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      content: text,
      direction: 'INBOUND',
      senderName: name ?? 'Cliente',
    },
  })

  if (isNew) {
    await emitEvent({
      unitId,
      eventType: 'CONVERSATION_OPENED',
      entityType: 'conversation',
      entityId: conversation.id,
      payload: {
        conversationId: conversation.id,
        guestPhone: phone,
        guestName: name,
        customerId: customer?.id ?? null,
        channel: 'whatsapp',
      },
    })
  }
}
