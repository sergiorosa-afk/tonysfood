'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { emitEvent } from '@/lib/events'
import { auth } from '@/lib/auth'
import { normalizePhone, phoneVariants } from '@/lib/utils/phone'
import { sendWaWebMessage, getWaWebStateForUnit } from '@/lib/whatsapp-web/service'

function formatReservationConfirmationMessage(
  guestName: string,
  date: Date,
  partySize: number,
  notes?: string | null,
): string {
  // Railway é UTC; datas são salvas sem conversão de fuso, então getUTC* retorna o horário digitado
  const day = date.getUTCDate().toString().padStart(2, '0')
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
  const year = date.getUTCFullYear()
  const hours = date.getUTCHours().toString().padStart(2, '0')
  const minutes = date.getUTCMinutes().toString().padStart(2, '0')

  let msg =
    `Olá, *${guestName}*! ✅\n\n` +
    `Sua reserva no *Tony's Food* foi confirmada:\n\n` +
    `📅 *${day}/${month}/${year}* às *${hours}:${minutes}*\n` +
    `👥 *${partySize} pessoa${partySize > 1 ? 's' : ''}*`

  if (notes) {
    msg += `\n📝 ${notes}`
  }

  msg += `\n\nAguardamos você! 🍽️`
  return msg
}

function sendReservationWhatsApp(
  unitId: string,
  phone: string,
  guestName: string,
  date: Date,
  partySize: number,
  notes?: string | null,
) {
  try {
    const waState = getWaWebStateForUnit(unitId)
    if (waState.status !== 'connected') return
    const msg = formatReservationConfirmationMessage(guestName, date, partySize, notes)
    sendWaWebMessage(unitId, phone, msg)
  } catch { /* notificação não crítica */ }
}

const reservationSchema = z.object({
  guestName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  guestPhone: z.string().optional(),
  guestEmail: z.string().optional(),
  date: z.string().min(1, 'Data é obrigatória'),
  time: z.string().min(1, 'Horário é obrigatório'),
  partySize: z.coerce.number().min(1).max(200),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'NO_SHOW', 'CHECKED_IN', 'COMPLETED']).default('PENDING'),
  channel: z.enum(['PHONE', 'WHATSAPP', 'INSTAGRAM', 'WALK_IN', 'APP', 'WEBSITE']).default('PHONE'),
  notes: z.string().optional(),
  tablePreference: z.string().optional(),
  unitId: z.string().min(1),
})

export type ReservationFormState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
}

export async function createReservation(
  prevState: ReservationFormState,
  formData: FormData
): Promise<ReservationFormState> {
  const session = await auth()
  if (!session) return { message: 'Não autorizado', success: false }

  const raw = Object.fromEntries(formData)
  const parsed = reservationSchema.safeParse(raw)

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, success: false }
  }

  const { date, time, ...rest } = parsed.data
  const reservationDate = new Date(`${date}T${time}:00`)

  // Normaliza telefone para formato WhatsApp (55XXNUMERO)
  if (rest.guestPhone) {
    rest.guestPhone = normalizePhone(rest.guestPhone)
  }

  try {
    // Find-or-create cliente se telefone informado
    let customerId: string | null = null
    if (rest.guestPhone) {
      const variants = phoneVariants(rest.guestPhone)
      const existing = await prisma.customer.findFirst({
        where: { unitId: rest.unitId, phone: { in: variants }, active: true },
        select: { id: true },
      })
      if (existing) {
        customerId = existing.id
      } else {
        const created = await prisma.customer.create({
          data: {
            name: rest.guestName,
            phone: rest.guestPhone,
            unitId: rest.unitId,
            segment: 'NEW',
          },
          select: { id: true },
        })
        customerId = created.id
        revalidatePath('/clientes')
      }
    }

    const reservation = await prisma.reservation.create({
      data: {
        ...rest,
        date: reservationDate,
        customerId,
        statusHistory: {
          create: { status: parsed.data.status, notes: 'Reserva criada' },
        },
      },
    })

    revalidatePath('/reservas')
    revalidatePath('/clientes')

    // emitEvent isolado — falha não impede o fluxo principal
    try {
      await emitEvent({
        unitId: rest.unitId,
        eventType: 'reservation.created',
        entityType: 'reservation',
        entityId: reservation.id,
        payload: { guestName: rest.guestName, partySize: rest.partySize, date: reservationDate },
      })
    } catch { /* evento não crítico */ }

    // Notificação WhatsApp se reserva já criada como CONFIRMED e tem telefone
    if (parsed.data.status === 'CONFIRMED' && rest.guestPhone) {
      sendReservationWhatsApp(
        rest.unitId,
        rest.guestPhone,
        rest.guestName,
        reservationDate,
        rest.partySize,
        rest.notes,
      )
    }

  } catch (error) {
    return { message: 'Erro ao criar reserva. Tente novamente.', success: false }
  }

  redirect('/reservas')
}

export async function updateReservation(
  id: string,
  prevState: ReservationFormState,
  formData: FormData
): Promise<ReservationFormState> {
  const session = await auth()
  if (!session) return { message: 'Não autorizado', success: false }

  const raw = Object.fromEntries(formData)
  const parsed = reservationSchema.safeParse(raw)

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, success: false }
  }

  const { date, time, ...rest } = parsed.data
  const reservationDate = new Date(`${date}T${time}:00`)

  try {
    await prisma.reservation.update({
      where: { id },
      data: { ...rest, date: reservationDate },
    })

    revalidatePath('/reservas')
    revalidatePath(`/reservas/${id}`)
  } catch (error) {
    return { message: 'Erro ao atualizar reserva.', success: false }
  }

  return { success: true, message: 'Reserva atualizada com sucesso.' }
}

export async function confirmReservation(id: string) {
  const session = await auth()
  if (!session) throw new Error('Não autorizado')

  const reservation = await prisma.reservation.update({
    where: { id },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
      statusHistory: { create: { status: 'CONFIRMED', notes: 'Confirmado manualmente' } },
    },
  })

  await emitEvent({
    unitId: reservation.unitId,
    eventType: 'reservation.confirmed',
    entityType: 'reservation',
    entityId: id,
    payload: { guestName: reservation.guestName },
  })

  // Notificação WhatsApp para o cliente
  if (reservation.guestPhone) {
    sendReservationWhatsApp(
      reservation.unitId,
      reservation.guestPhone,
      reservation.guestName,
      reservation.date,
      reservation.partySize,
      reservation.notes,
    )
  }

  revalidatePath('/reservas')
  revalidatePath(`/reservas/${id}`)
  revalidatePath('/dashboard')
}

export async function cancelReservation(id: string, reason?: string) {
  const session = await auth()
  if (!session) throw new Error('Não autorizado')

  const reservation = await prisma.reservation.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      statusHistory: { create: { status: 'CANCELLED', notes: reason || 'Cancelado manualmente' } },
    },
  })

  await emitEvent({
    unitId: reservation.unitId,
    eventType: 'reservation.cancelled',
    entityType: 'reservation',
    entityId: id,
    payload: { guestName: reservation.guestName, reason },
  })

  revalidatePath('/reservas')
  revalidatePath(`/reservas/${id}`)
  revalidatePath('/dashboard')
}

export async function checkInReservation(id: string) {
  const session = await auth()
  if (!session) throw new Error('Não autorizado')

  const reservation = await prisma.reservation.update({
    where: { id },
    data: {
      status: 'CHECKED_IN',
      checkedInAt: new Date(),
      statusHistory: { create: { status: 'CHECKED_IN', notes: 'Check-in realizado' } },
    },
  })

  await emitEvent({
    unitId: reservation.unitId,
    eventType: 'reservation.checked_in',
    entityType: 'reservation',
    entityId: id,
    payload: { guestName: reservation.guestName, checkedInAt: new Date() },
  })

  revalidatePath('/reservas')
  revalidatePath(`/reservas/${id}`)
  revalidatePath('/dashboard')
}

export async function markNoShow(id: string) {
  const session = await auth()
  if (!session) throw new Error('Não autorizado')

  const reservation = await prisma.reservation.update({
    where: { id },
    data: {
      status: 'NO_SHOW',
      statusHistory: { create: { status: 'NO_SHOW', notes: 'Marcado como no-show' } },
    },
  })

  await emitEvent({
    unitId: reservation.unitId,
    eventType: 'reservation.no_show',
    entityType: 'reservation',
    entityId: id,
    payload: { guestName: reservation.guestName },
  })

  revalidatePath('/reservas')
  revalidatePath(`/reservas/${id}`)
}
