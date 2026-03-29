'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ─── WhatsApp integration ──────────────────────────────────────────────────

const whatsappSchema = z.object({
  phoneNumberId:  z.string().min(1, 'Phone Number ID obrigatório'),
  accessToken:    z.string().min(1, 'Access Token obrigatório'),
  verifyToken:    z.string().min(6, 'Verify Token deve ter ao menos 6 caracteres'),
  webhookSecret:  z.string().optional(),
  businessName:   z.string().optional(),
})

export async function saveWhatsappConfig(_: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  const raw = Object.fromEntries(formData)
  const parsed = whatsappSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const unitId = (session.user as any).unitId
  const { phoneNumberId, accessToken, verifyToken, webhookSecret, businessName } = parsed.data

  await prisma.integration.upsert({
    where: { unitId_type: { unitId, type: 'whatsapp' } },
    create: {
      unitId,
      type: 'whatsapp',
      name: 'WhatsApp Business',
      active: true,
      config: { phoneNumberId, accessToken, verifyToken, webhookSecret: webhookSecret || null, businessName: businessName || null },
    },
    update: {
      active: true,
      config: { phoneNumberId, accessToken, verifyToken, webhookSecret: webhookSecret || null, businessName: businessName || null },
    },
  })

  revalidatePath('/integracoes')
  revalidatePath('/integracoes/whatsapp')
  return { success: true }
}

export async function toggleIntegration(id: string, active: boolean) {
  const session = await auth()
  if (!session?.user) return

  await prisma.integration.update({ where: { id }, data: { active } })
  revalidatePath('/integracoes')
}

// ─── Webhook actions ───────────────────────────────────────────────────────

const ALLOWED_EVENTS = [
  'RESERVATION_CREATED', 'RESERVATION_CONFIRMED', 'RESERVATION_CANCELLED',
  'RESERVATION_CHECKIN', 'QUEUE_JOINED', 'QUEUE_CALLED', 'QUEUE_SEATED',
  'QUEUE_ABANDONED', 'CONVERSATION_OPENED', 'CUSTOMER_CREATED',
]

const webhookSchema = z.object({
  name:   z.string().min(1, 'Nome obrigatório'),
  url:    z.string().url('URL inválida'),
  secret: z.string().optional(),
})

export async function createWebhook(_: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  const raw = Object.fromEntries(formData)
  const parsed = webhookSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const events = ALLOWED_EVENTS.filter((e) => formData.get(`event_${e}`) === 'on')
  if (events.length === 0) return { error: 'Selecione ao menos um evento' }

  const unitId = (session.user as any).unitId
  const { name, url, secret } = parsed.data

  const wh = await prisma.webhook.create({
    data: { unitId, name, url, secret: secret || null, events },
  })

  revalidatePath('/integracoes')
  return { success: true, id: wh.id }
}

export async function updateWebhook(id: string, _: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  const raw = Object.fromEntries(formData)
  const parsed = webhookSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const events = ALLOWED_EVENTS.filter((e) => formData.get(`event_${e}`) === 'on')
  if (events.length === 0) return { error: 'Selecione ao menos um evento' }

  const { name, url, secret } = parsed.data

  await prisma.webhook.update({
    where: { id },
    data: { name, url, secret: secret || null, events },
  })

  revalidatePath('/integracoes')
  revalidatePath(`/integracoes/webhooks/${id}`)
  return { success: true }
}

export async function toggleWebhook(id: string, active: boolean) {
  const session = await auth()
  if (!session?.user) return

  await prisma.webhook.update({ where: { id }, data: { active } })
  revalidatePath('/integracoes')
}

export async function deleteWebhook(id: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  await prisma.webhook.delete({ where: { id } })
  revalidatePath('/integracoes')
  return { success: true }
}

export async function testWebhook(id: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  const wh = await prisma.webhook.findUnique({ where: { id } })
  if (!wh) return { error: 'Webhook não encontrado' }

  const { buildSignatureHeader } = await import('@/lib/utils/hmac')

  const testPayload = {
    event: 'TEST',
    occurredAt: new Date().toISOString(),
    unitId: wh.unitId,
    data: { message: 'Tony\'s Food webhook test ping 🍕' },
  }
  const body = JSON.stringify(testPayload)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'TonysFood-Webhooks/1.0',
    'X-Event-Type': 'TEST',
  }
  if (wh.secret) headers['X-Signature'] = buildSignatureHeader(wh.secret, body)

  const start = Date.now()
  let statusCode: number | null = null
  let response: string | null = null
  let success = false

  try {
    const res = await fetch(wh.url, {
      method: 'POST', headers, body,
      signal: AbortSignal.timeout(10000),
    })
    statusCode = res.status
    response = await res.text().catch(() => null)
    success = res.ok
  } catch (err) {
    response = String(err)
  }

  await prisma.webhookLog.create({
    data: {
      webhookId: id,
      eventType: 'TEST',
      payload: testPayload as any,
      statusCode,
      response: response?.slice(0, 2000) ?? null,
      durationMs: Date.now() - start,
      success,
    },
  })

  revalidatePath(`/integracoes/webhooks/${id}`)
  revalidatePath('/integracoes')
  return { success, statusCode, response: response?.slice(0, 500) }
}
