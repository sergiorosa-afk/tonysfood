'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { emitEvent } from '@/lib/events'
import { auth } from '@/lib/auth'

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

  try {
    const reservation = await prisma.reservation.create({
      data: {
        ...rest,
        date: reservationDate,
        statusHistory: {
          create: { status: parsed.data.status, notes: 'Reserva criada' },
        },
      },
    })

    await emitEvent({
      unitId: rest.unitId,
      eventType: 'reservation.created',
      entityType: 'reservation',
      entityId: reservation.id,
      payload: { guestName: rest.guestName, partySize: rest.partySize, date: reservationDate },
    })

    revalidatePath('/reservas')
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
