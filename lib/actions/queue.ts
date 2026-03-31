'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { emitEvent } from '@/lib/events'
import { auth } from '@/lib/auth'
import { getNextPosition } from '@/lib/queries/queue'
import { getWaWebStateForUnit, sendWaWebMessage } from '@/lib/whatsapp-web/service'
import { normalizePhone, phoneVariants } from '@/lib/utils/phone'

const joinSchema = z.object({
  guestName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  guestPhone: z.string().optional(),
  partySize: z.coerce.number().min(1).max(50),
  channel: z.enum(['IN_PERSON', 'WHATSAPP', 'PHONE', 'APP']).default('IN_PERSON'),
  notes: z.string().optional(),
  unitId: z.string().min(1),
})

export type QueueFormState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
}

export async function joinQueue(
  prevState: QueueFormState,
  formData: FormData
): Promise<QueueFormState> {
  const session = await auth()
  if (!session) return { message: 'Não autorizado', success: false }

  const parsed = joinSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, success: false }
  }

  const { unitId, ...rest } = parsed.data
  const position = await getNextPosition(unitId)

  // ETA: ~15 min per group ahead
  const estimatedWait = position * 15

  // Normaliza telefone para formato WhatsApp (55XXNUMERO)
  if (rest.guestPhone) {
    rest.guestPhone = normalizePhone(rest.guestPhone)
  }

  try {
    // Find-or-create cliente se telefone informado
    let customerSegment: string | null = null
    let customerId: string | null = null
    if (rest.guestPhone) {
      const variants = phoneVariants(rest.guestPhone)
      const existing = await prisma.customer.findFirst({
        where: { unitId, phone: { in: variants }, active: true },
        select: { id: true, segment: true },
      })
      if (existing) {
        customerId = existing.id
        customerSegment = existing.segment
      } else {
        const created = await prisma.customer.create({
          data: {
            name: rest.guestName,
            phone: rest.guestPhone,
            unitId,
            segment: 'NEW',
          },
          select: { id: true, segment: true },
        })
        customerId = created.id
        customerSegment = created.segment
        revalidatePath('/clientes')
      }
    }

    const entry = await prisma.queueEntry.create({
      data: {
        ...rest,
        unitId,
        position,
        estimatedWait,
        customerId,
        status: 'WAITING',
        statusHistory: { create: { status: 'WAITING', notes: 'Entrou na fila' } },
      },
    })

    revalidatePath('/fila')
    revalidatePath('/dashboard')
    revalidatePath('/clientes')

    // emitEvent isolado — falha não impede o fluxo principal
    try {
      await emitEvent({
        unitId,
        eventType: 'QUEUE_JOINED',
        entityType: 'queue_entry',
        entityId: entry.id,
        payload: {
          guestName: rest.guestName,
          partySize: rest.partySize,
          position,
          guestPhone: rest.guestPhone ?? null,
          segment: customerSegment,
          customerId,
        },
      })
    } catch { /* evento não crítico */ }

    // Send welcome WhatsApp message if connected and guest has phone
    if (rest.guestPhone) {
      const waState = getWaWebStateForUnit(unitId)
      if (waState.status === 'connected') {
        const firstName = rest.guestName.split(' ')[0]
        const waitMsg = estimatedWait <= 15
          ? `O tempo estimado de espera é de aproximadamente *${estimatedWait} minutos*.`
          : `O tempo estimado de espera é de aproximadamente *${estimatedWait} minutos* — fique à vontade para aguardar confortavelmente.`

        const welcomeMsg =
          `Olá, *${firstName}*! 🍽️ Seja muito bem-vindo(a) ao *Tony's Food*!\n\n` +
          `Sua entrada na fila foi confirmada com sucesso.\n\n` +
          `📋 *Resumo da sua fila:*\n` +
          `• Posição: *${position}º lugar*\n` +
          `• Grupo: *${rest.partySize} pessoa${rest.partySize !== 1 ? 's' : ''}*\n` +
          `• ${waitMsg}\n\n` +
          `Assim que sua mesa estiver pronta, você receberá uma mensagem aqui mesmo. ` +
          `Por favor, mantenha o celular por perto! 📱\n\n` +
          `_Enquanto isso, aproveite nosso espaço e fique à vontade. ` +
          `Estamos preparando tudo com muito carinho para você._ 🤍`

        sendWaWebMessage(unitId, rest.guestPhone, welcomeMsg)
        // Catalog offers now handled by the automation engine via SEND_CATALOG_OFFERS action
      }
    }
  } catch {
    return { message: 'Erro ao entrar na fila. Tente novamente.', success: false }
  }

  return { success: true, message: 'Adicionado à fila com sucesso.' }
}

export async function callGuest(id: string) {
  const session = await auth()
  if (!session) throw new Error('Não autorizado')

  const entry = await prisma.queueEntry.update({
    where: { id },
    data: {
      status: 'CALLED',
      calledAt: new Date(),
      statusHistory: { create: { status: 'CALLED', notes: 'Chamado para a mesa' } },
    },
  })

  // Send WhatsApp message if connected and guest has phone
  if (entry.guestPhone) {
    const waState = getWaWebStateForUnit(entry.unitId)
    if (waState.status === 'connected') {
      const msg =
        `Olá, *${entry.guestName}*! 🍽️\n\n` +
        `Sua mesa está pronta! Por favor, dirija-se à recepção.\n\n` +
        `Grupo: *${entry.partySize} pessoa${entry.partySize !== 1 ? 's' : ''}*\n\n` +
        `_Tony's Food — Obrigado pela paciência!_`
      sendWaWebMessage(entry.unitId, entry.guestPhone, msg)
    }
  }

  await emitEvent({
    unitId: entry.unitId,
    eventType: 'QUEUE_CALLED',
    entityType: 'queue_entry',
    entityId: id,
    payload: { guestName: entry.guestName, partySize: entry.partySize },
  })

  revalidatePath('/fila')
  revalidatePath('/dashboard')
}

export async function seatGuest(id: string) {
  const session = await auth()
  if (!session) throw new Error('Não autorizado')

  const entry = await prisma.queueEntry.update({
    where: { id },
    data: {
      status: 'SEATED',
      seatedAt: new Date(),
      statusHistory: { create: { status: 'SEATED', notes: 'Sentado à mesa' } },
    },
  })

  await emitEvent({
    unitId: entry.unitId,
    eventType: 'QUEUE_SEATED',
    entityType: 'queue_entry',
    entityId: id,
    payload: { guestName: entry.guestName, newStatus: 'SEATED' },
  })

  revalidatePath('/fila')
  revalidatePath('/dashboard')
}

export async function abandonQueue(id: string, reason?: string) {
  const session = await auth()
  if (!session) throw new Error('Não autorizado')

  const entry = await prisma.queueEntry.update({
    where: { id },
    data: {
      status: 'ABANDONED',
      abandonedAt: new Date(),
      abandonReason: reason || null,
      statusHistory: { create: { status: 'ABANDONED', notes: reason || 'Desistiu da fila' } },
    },
  })

  // Reorder remaining entries
  await reorderQueue(entry.unitId, entry.position)

  // Notify guest via WhatsApp if connected and has phone
  if (entry.guestPhone) {
    const waState = getWaWebStateForUnit(entry.unitId)
    if (waState.status === 'connected') {
      const firstName = entry.guestName.split(' ')[0]
      const msg =
        `Olá, *${firstName}*! 👋\n\n` +
        `Informamos que sua posição na fila do *Tony's Food* foi encerrada.\n\n` +
        `Esperamos te receber em breve! 🍽️`
      sendWaWebMessage(entry.unitId, entry.guestPhone, msg)
    }
  }

  await emitEvent({
    unitId: entry.unitId,
    eventType: 'QUEUE_ABANDONED',
    entityType: 'queue_entry',
    entityId: id,
    payload: { guestName: entry.guestName, reason },
  })

  revalidatePath('/fila')
  revalidatePath('/dashboard')
}

export async function transferGuest(id: string) {
  const session = await auth()
  if (!session) throw new Error('Não autorizado')

  const entry = await prisma.queueEntry.update({
    where: { id },
    data: {
      status: 'TRANSFERRED',
      statusHistory: { create: { status: 'TRANSFERRED', notes: 'Transferido' } },
    },
  })

  await emitEvent({
    unitId: entry.unitId,
    eventType: 'queue.transferred',
    entityType: 'queue_entry',
    entityId: id,
    payload: { guestName: entry.guestName },
  })

  revalidatePath('/fila')
}

async function reorderQueue(unitId: string, removedPosition: number) {
  await prisma.queueEntry.updateMany({
    where: {
      unitId,
      status: 'WAITING',
      position: { gt: removedPosition },
    },
    data: { position: { decrement: 1 } },
  })
}
