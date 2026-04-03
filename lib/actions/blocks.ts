'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

const blockSchema = z.object({
  unitId:    z.string().min(1),
  label:     z.string().optional(),
  // O que bloquear
  allDay:    z.coerce.boolean().optional(),
  period:    z.enum(['morning','lunch','afternoon','evening']).optional(),
  startTime: z.string().optional(),
  endTime:   z.string().optional(),
  // Quando / frequência
  frequency: z.enum(['once','daily','weekly','biweekly','monthly']),
  date:      z.string().optional(),   // YYYY-MM-DD
  weekDay:   z.coerce.number().min(0).max(6).optional(),
})

export type BlockFormState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
}

export async function createBlock(
  prevState: BlockFormState,
  formData: FormData,
): Promise<BlockFormState> {
  const session = await auth()
  if (!session) return { message: 'Não autorizado', success: false }

  const raw    = Object.fromEntries(formData)
  // checkbox allDay vem como 'on' ou ausente
  if (raw.allDay === 'on') raw.allDay = 'true'

  const parsed = blockSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, success: false }
  }

  const { unitId, label, allDay, period, startTime, endTime, frequency, date, weekDay } = parsed.data

  // Validações de negócio
  if (!allDay && !period && (!startTime || !endTime)) {
    return { message: 'Selecione o que bloquear: dia todo, período ou intervalo de horário.', success: false }
  }
  if (frequency === 'once' && !date) {
    return { message: 'Informe a data do bloqueio.', success: false }
  }
  if ((frequency === 'weekly' || frequency === 'biweekly') && weekDay == null) {
    return { message: 'Selecione o dia da semana.', success: false }
  }
  if (frequency === 'biweekly' && !date) {
    return { message: 'Informe a data de referência para o bloqueio quinzenal.', success: false }
  }
  if (frequency === 'monthly' && !date) {
    return { message: 'Informe a data de referência para o bloqueio mensal.', success: false }
  }

  try {
    await prisma.reservationBlock.create({
      data: {
        unitId,
        label:     label || null,
        allDay:    !!allDay,
        period:    allDay ? null : (period || null),
        startTime: allDay || period ? null : (startTime || null),
        endTime:   allDay || period ? null : (endTime || null),
        frequency,
        date:      date ? new Date(`${date}T00:00:00Z`) : null,
        weekDay:   weekDay ?? null,
      },
    })

    revalidatePath('/bloqueios')
    return { success: true, message: 'Bloqueio criado com sucesso.' }
  } catch {
    return { message: 'Erro ao criar bloqueio. Tente novamente.', success: false }
  }
}

export async function deleteBlock(id: string) {
  const session = await auth()
  if (!session) throw new Error('Não autorizado')

  await prisma.reservationBlock.delete({ where: { id } })
  revalidatePath('/bloqueios')
}

export async function toggleBlock(id: string, active: boolean) {
  const session = await auth()
  if (!session) throw new Error('Não autorizado')

  await prisma.reservationBlock.update({ where: { id }, data: { active } })
  revalidatePath('/bloqueios')
}
