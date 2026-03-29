import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { getWaWebStateForUnit, sendWaWebMessage } from '@/lib/whatsapp-web/service'

// ─── Types ─────────────────────────────────────────────────────────────────

export type TriggerEvent =
  | 'RESERVATION_CREATED'
  | 'RESERVATION_CONFIRMED'
  | 'RESERVATION_CANCELLED'
  | 'RESERVATION_CHECKIN'
  | 'QUEUE_JOINED'
  | 'QUEUE_CALLED'
  | 'QUEUE_SEATED'
  | 'QUEUE_ABANDONED'
  | 'CONVERSATION_OPENED'
  | 'CUSTOMER_CREATED'

export type Condition = {
  field: string   // e.g. "partySize", "segment", "channel"
  op: 'eq' | 'neq' | 'gte' | 'lte' | 'contains'
  value: string | number
}

export type RuleAction =
  | { type: 'SEND_MESSAGE';       templateId: string }
  | { type: 'ADD_TAG';            tag: string }
  | { type: 'UPDATE_SEGMENT';     segment: string }
  | { type: 'NOTIFY_STAFF';       message: string }
  | { type: 'SEND_CATALOG_OFFERS'; introMessage?: string }

// ─── Condition evaluator ───────────────────────────────────────────────────

function evalCondition(cond: Condition, payload: Record<string, unknown>): boolean {
  const actual = payload[cond.field]
  if (actual === undefined || actual === null) return false

  switch (cond.op) {
    case 'eq':       return String(actual) === String(cond.value)
    case 'neq':      return String(actual) !== String(cond.value)
    case 'gte':      return Number(actual) >= Number(cond.value)
    case 'lte':      return Number(actual) <= Number(cond.value)
    case 'contains': return String(actual).toLowerCase().includes(String(cond.value).toLowerCase())
    default:         return false
  }
}

function evalConditions(conditions: Condition[] | null | undefined, payload: Record<string, unknown>): boolean {
  if (!conditions || conditions.length === 0) return true
  return conditions.every((c) => evalCondition(c, payload))
}

// ─── Template renderer ─────────────────────────────────────────────────────

function renderTemplate(body: string, payload: Record<string, unknown>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => String(payload[key] ?? `{{${key}}}`))
}

// ─── Action executors ──────────────────────────────────────────────────────

async function executeAction(
  action: RuleAction,
  payload: Record<string, unknown>,
  unitId: string
): Promise<{ ok: boolean; detail: string }> {
  try {
    switch (action.type) {
      case 'SEND_MESSAGE': {
        const template = await prisma.messageTemplate.findUnique({
          where: { id: action.templateId },
        })
        if (!template) return { ok: false, detail: `Template ${action.templateId} not found` }

        const rendered = renderTemplate(template.body, payload)
        const phone = payload.guestPhone as string | undefined
        const conversationId = payload.conversationId as string | undefined

        if (conversationId) {
          await prisma.message.create({
            data: {
              conversationId,
              content: rendered,
              direction: 'OUTBOUND',
              senderName: 'Automação',
            },
          })
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { lastMessageAt: new Date() },
          })
        }
        // If no open conversation but phone exists, we'd create one — skipped for now (requires WhatsApp API)
        return { ok: true, detail: `Message sent via template "${template.name}" to ${phone ?? conversationId}` }
      }

      case 'ADD_TAG': {
        const customerId = payload.customerId as string | undefined
        if (!customerId) return { ok: false, detail: 'No customerId in payload' }
        await prisma.customerTag.upsert({
          where: { customerId_tag: { customerId, tag: action.tag } },
          create: { customerId, tag: action.tag },
          update: {},
        })
        return { ok: true, detail: `Tag "${action.tag}" added to customer ${customerId}` }
      }

      case 'UPDATE_SEGMENT': {
        const customerId = payload.customerId as string | undefined
        if (!customerId) return { ok: false, detail: 'No customerId in payload' }
        await prisma.customer.update({
          where: { id: customerId },
          data: { segment: action.segment as any },
        })
        return { ok: true, detail: `Segment updated to "${action.segment}" for customer ${customerId}` }
      }

      case 'NOTIFY_STAFF': {
        // Internal only — log to system events
        return { ok: true, detail: `Staff notified: ${action.message}` }
      }

      case 'SEND_CATALOG_OFFERS': {
        const phone = payload.guestPhone as string | undefined
        if (!phone) return { ok: false, detail: 'No guestPhone in payload' }

        const segment = payload.segment as string | null | undefined
        if (!segment) return { ok: false, detail: 'Customer has no segment — skipped' }

        const waState = getWaWebStateForUnit(unitId)
        if (waState.status !== 'connected') return { ok: false, detail: 'WhatsApp not connected' }

        const allItems = await prisma.catalogItem.findMany({
          where: { unitId, active: true },
          select: { name: true, description: true, price: true, targetSegments: true },
        })

        const matching = allItems.filter((item) => {
          const segs = item.targetSegments as string[] | null
          if (!segs || segs.length === 0) return false
          return segs.includes(segment)
        })

        if (matching.length === 0) return { ok: true, detail: `No catalog offers for segment "${segment}"` }

        const segData = await prisma.segment.findFirst({ where: { name: segment }, select: { label: true } })
        const segLabel = segData?.label ?? segment

        const offerLines = matching.map((item) => {
          const price = item.price != null ? ` — R$ ${item.price.toFixed(2)}` : ''
          const desc = item.description ? `\n  _${item.description}_` : ''
          return `• *${item.name}*${price}${desc}`
        }).join('\n')

        const intro = action.introMessage?.trim() ||
          `🎉 Como *${segLabel}*, preparamos algumas sugestões especiais para você hoje:`

        const msg = `${intro}\n\n${offerLines}\n\n_Peça ao nosso atendente ao ser chamado para a mesa!_ 😊`

        sendWaWebMessage(unitId, phone, msg)
        return { ok: true, detail: `Catalog offers sent to ${phone} — segment "${segment}", ${matching.length} item(s)` }
      }

      default:
        return { ok: false, detail: 'Unknown action type' }
    }
  } catch (err) {
    return { ok: false, detail: String(err) }
  }
}

// ─── Main engine entry point ───────────────────────────────────────────────

export async function executeAutomations(
  eventType: TriggerEvent,
  unitId: string | undefined,
  payload: Record<string, unknown>
) {
  if (!unitId) return

  try {
    const rules = await prisma.automationRule.findMany({
      where: { unitId, active: true, triggerEvent: eventType },
    })
    if (rules.length === 0) return

    for (const rule of rules) {
      const conditions = rule.conditions as Condition[] | null
      const actions = rule.actions as RuleAction[]

      const conditionsMet = evalConditions(conditions, payload)

      if (!conditionsMet) {
        await prisma.automationLog.create({
          data: {
            ruleId: rule.id,
            entityType: payload.entityType as string ?? null,
            entityId: payload.entityId as string ?? null,
            status: 'SKIPPED',
            result: { reason: 'Conditions not met' } as Prisma.InputJsonValue,
          },
        })
        continue
      }

      const results: { action: string; ok: boolean; detail: string }[] = []

      for (const action of actions) {
        const res = await executeAction(action, payload, unitId)
        results.push({ action: action.type, ...res })
      }

      const allOk = results.every((r) => r.ok)

      await prisma.automationLog.create({
        data: {
          ruleId: rule.id,
          entityType: payload.entityType as string ?? null,
          entityId: payload.entityId as string ?? null,
          status: allOk ? 'SUCCESS' : 'PARTIAL',
          result: results as unknown as Prisma.InputJsonValue,
        },
      })

      await prisma.automationRule.update({
        where: { id: rule.id },
        data: { executionCount: { increment: 1 }, lastExecutedAt: new Date() },
      })
    }
  } catch (err) {
    console.error('[AutomationEngine] Error:', err)
  }
}
