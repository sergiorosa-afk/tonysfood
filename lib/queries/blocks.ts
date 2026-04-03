import { prisma } from '@/lib/db'

export const PERIOD_LABELS: Record<string, string> = {
  morning:  'Manhã (06h–12h)',
  lunch:    'Almoço (12h–15h)',
  afternoon:'Tarde (12h–18h)',
  evening:  'Noite (18h–24h)',
}

export const FREQUENCY_LABELS: Record<string, string> = {
  once:      'Uma vez',
  daily:     'Todos os dias',
  weekly:    'Semanal',
  biweekly:  'Quinzenal',
  monthly:   'Mensal',
}

export const WEEKDAY_LABELS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']

// Faixas de minutos de cada período
const PERIOD_RANGES: Record<string, [number, number]> = {
  morning:   [6 * 60, 12 * 60],
  lunch:     [12 * 60, 15 * 60],
  afternoon: [12 * 60, 18 * 60],
  evening:   [18 * 60, 24 * 60],
}

export async function getBlocks(unitId?: string) {
  return prisma.reservationBlock.findMany({
    where: unitId ? { unitId } : {},
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Verifica se a data+hora informadas estão bloqueadas para o unitId.
 * dateStr: YYYY-MM-DD  |  timeStr: HH:MM
 */
export async function isDateTimeBlocked(
  unitId: string,
  dateStr: string,
  timeStr: string,
): Promise<{ blocked: boolean; reason?: string }> {
  const blocks = await prisma.reservationBlock.findMany({
    where: { unitId, active: true },
  })

  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute]     = timeStr.split(':').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  const dayOfWeek     = d.getUTCDay()           // 0=Dom..6=Sáb
  const timeInMinutes = hour * 60 + minute

  for (const block of blocks) {
    let dateMatches = false

    if (block.frequency === 'once' && block.date) {
      const bd = block.date
      const bdStr = `${bd.getUTCFullYear()}-${String(bd.getUTCMonth() + 1).padStart(2,'0')}-${String(bd.getUTCDate()).padStart(2,'0')}`
      dateMatches = bdStr === dateStr

    } else if (block.frequency === 'daily') {
      dateMatches = true

    } else if (block.frequency === 'weekly' && block.weekDay != null) {
      dateMatches = dayOfWeek === block.weekDay

    } else if (block.frequency === 'biweekly' && block.weekDay != null && block.date) {
      if (dayOfWeek === block.weekDay) {
        const ref      = block.date
        const refDay   = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()))
        const diffWeeks= Math.round((d.getTime() - refDay.getTime()) / (7 * 24 * 60 * 60 * 1000))
        dateMatches    = diffWeeks >= 0 && diffWeeks % 2 === 0
      }

    } else if (block.frequency === 'monthly' && block.date) {
      dateMatches = block.date.getUTCDate() === day
    }

    if (!dateMatches) continue

    // Verifica se o horário está na janela bloqueada
    if (block.allDay) {
      return { blocked: true, reason: block.label || 'Dia bloqueado' }
    }

    if (block.period) {
      const range = PERIOD_RANGES[block.period]
      if (range && timeInMinutes >= range[0] && timeInMinutes < range[1]) {
        return { blocked: true, reason: block.label || `Período ${PERIOD_LABELS[block.period] ?? block.period} bloqueado` }
      }
    }

    if (block.startTime && block.endTime) {
      const [sh, sm] = block.startTime.split(':').map(Number)
      const [eh, em] = block.endTime.split(':').map(Number)
      const blockStart = sh * 60 + sm
      const blockEnd   = eh * 60 + em
      if (timeInMinutes >= blockStart && timeInMinutes < blockEnd) {
        return { blocked: true, reason: block.label || `Horário ${block.startTime}–${block.endTime} bloqueado` }
      }
    }
  }

  return { blocked: false }
}
