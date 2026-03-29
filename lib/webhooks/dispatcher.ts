import { prisma } from '@/lib/db'
import { buildSignatureHeader } from '@/lib/utils/hmac'
import { Prisma } from '@prisma/client'

/**
 * Dispatches an event to all active outbound webhooks subscribed to that event.
 * Non-blocking — failures are logged but do not throw.
 */
export async function dispatchWebhooks(
  eventType: string,
  unitId: string | undefined,
  payload: Record<string, unknown>
) {
  if (!unitId) return

  try {
    const webhooks = await prisma.webhook.findMany({
      where: { unitId, active: true },
    })

    const subscribed = webhooks.filter((wh) => {
      const events = wh.events as string[]
      return events.includes(eventType) || events.includes('*')
    })

    if (subscribed.length === 0) return

    const body = JSON.stringify({
      event: eventType,
      occurredAt: new Date().toISOString(),
      unitId,
      data: payload,
    })

    await Promise.allSettled(
      subscribed.map((wh) => callWebhook(wh, eventType, body, payload))
    )
  } catch (err) {
    console.error('[Dispatcher] Error fetching webhooks:', err)
  }
}

async function callWebhook(
  wh: { id: string; url: string; secret: string | null },
  eventType: string,
  body: string,
  payload: Record<string, unknown>
) {
  const start = Date.now()
  let statusCode: number | null = null
  let response: string | null = null
  let success = false

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'TonysFood-Webhooks/1.0',
      'X-Event-Type': eventType,
    }

    if (wh.secret) {
      headers['X-Signature'] = buildSignatureHeader(wh.secret, body)
    }

    const res = await fetch(wh.url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(10000), // 10s timeout
    })

    statusCode = res.status
    response = await res.text().catch(() => null)
    success = res.ok
  } catch (err) {
    response = String(err)
    success = false
  }

  const durationMs = Date.now() - start

  // Log result
  await prisma.webhookLog.create({
    data: {
      webhookId: wh.id,
      eventType,
      payload: payload as Prisma.InputJsonValue,
      statusCode,
      response: response?.slice(0, 2000) ?? null,
      durationMs,
      success,
    },
  }).catch(() => {/* non-blocking */})

  // Update webhook counters
  await prisma.webhook.update({
    where: { id: wh.id },
    data: {
      lastCalledAt: new Date(),
      ...(success
        ? { successCount: { increment: 1 } }
        : { failureCount: { increment: 1 } }),
    },
  }).catch(() => {/* non-blocking */})
}
