import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { executeAutomations, type TriggerEvent } from '@/lib/engine/automation-engine'
import { dispatchWebhooks } from '@/lib/webhooks/dispatcher'

export async function emitEvent({
  unitId,
  eventType,
  entityType,
  entityId,
  payload,
}: {
  unitId?: string
  eventType: string
  entityType?: string
  entityId?: string
  payload?: Prisma.InputJsonValue
}) {
  try {
    await prisma.systemEvent.create({
      data: {
        unitId,
        eventType,
        entityType,
        entityId,
        payload,
        occurredAt: new Date(),
      },
    })
  } catch (error) {
    console.error('[emitEvent] Failed to emit event:', eventType, error)
  }

  // Trigger automation engine (non-blocking)
  const enginePayload: Record<string, unknown> = {
    entityType,
    entityId,
    ...((payload && typeof payload === 'object' && !Array.isArray(payload))
      ? (payload as Record<string, unknown>)
      : {}),
  }
  executeAutomations(eventType as TriggerEvent, unitId, enginePayload).catch((err) =>
    console.error('[emitEvent] Automation engine error:', err)
  )

  dispatchWebhooks(eventType, unitId, enginePayload).catch((err) =>
    console.error('[emitEvent] Webhook dispatcher error:', err)
  )
}
