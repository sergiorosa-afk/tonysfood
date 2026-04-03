import Link from 'next/link'
import { Plus, CalendarOff, Clock, RefreshCw } from 'lucide-react'
import { getBlocks, PERIOD_LABELS, FREQUENCY_LABELS, WEEKDAY_LABELS } from '@/lib/queries/blocks'
import { BlockActions } from '@/components/blocks/block-actions'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

function describeBlock(block: {
  allDay: boolean
  period: string | null
  startTime: string | null
  endTime: string | null
  frequency: string
  date: Date | null
  weekDay: number | null
}): string {
  // O que
  let what = ''
  if (block.allDay) what = 'Dia inteiro'
  else if (block.period) what = PERIOD_LABELS[block.period] ?? block.period
  else if (block.startTime && block.endTime) what = `${block.startTime} – ${block.endTime}`

  // Quando
  let when = ''
  if (block.frequency === 'once' && block.date) {
    const d = block.date
    when = `${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}/${d.getUTCFullYear()}`
  } else if (block.frequency === 'daily') {
    when = 'todos os dias'
  } else if (block.frequency === 'weekly' && block.weekDay != null) {
    when = `toda ${WEEKDAY_LABELS[block.weekDay]}`
  } else if (block.frequency === 'biweekly' && block.weekDay != null) {
    when = `quinzenal às ${WEEKDAY_LABELS[block.weekDay]}s`
  } else if (block.frequency === 'monthly' && block.date) {
    when = `todo dia ${block.date.getUTCDate()}`
  }

  return [what, when].filter(Boolean).join(' — ')
}

export default async function BloqueiosPage() {
  const session = await auth()
  const unitId  = (session?.user as any)?.unitId
  const unit    = await prisma.unit.findFirst({ where: { active: true } })
  const blocks  = await getBlocks(unitId || unit?.id)

  const active   = blocks.filter(b => b.active)
  const inactive = blocks.filter(b => !b.active)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bloqueios de Reserva</h1>
          <p className="text-slate-500 mt-1 text-sm">Datas e horários em que não é permitido reservar</p>
        </div>
        <Link
          href="/bloqueios/novo"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Bloqueio
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <CalendarOff className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-xl font-bold text-slate-900">{active.length}</p>
            <p className="text-xs text-slate-500">Bloqueios ativos</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <div>
            <p className="text-xl font-bold text-slate-900">{blocks.filter(b => b.frequency !== 'once').length}</p>
            <p className="text-xs text-slate-500">Recorrentes</p>
          </div>
        </div>
      </div>

      {/* Lista de bloqueios ativos */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ativos</p>
        </div>

        {active.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarOff className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">Nenhum bloqueio ativo</p>
            <Link href="/bloqueios/novo" className="mt-3 text-sm text-red-600 hover:underline font-medium">
              Criar primeiro bloqueio
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Descrição / Horário</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Frequência</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Nota</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {active.map((block) => (
                <tr key={block.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <CalendarOff className="w-3 h-3 mr-1" />
                        {block.allDay ? 'Dia inteiro' : block.period ? PERIOD_LABELS[block.period] : `${block.startTime}–${block.endTime}`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{describeBlock(block)}</p>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span className="text-sm text-slate-700">{FREQUENCY_LABELS[block.frequency] ?? block.frequency}</span>
                    {block.weekDay != null && (
                      <span className="text-xs text-slate-400 block">{WEEKDAY_LABELS[block.weekDay]}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-sm text-slate-500">{block.label || '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <BlockActions id={block.id} active={block.active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bloqueios inativos */}
      {inactive.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm opacity-60">
          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Inativos</p>
          </div>
          <table className="w-full">
            <tbody className="divide-y divide-slate-50">
              {inactive.map((block) => (
                <tr key={block.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-500 line-through">{describeBlock(block)}</p>
                    {block.label && <p className="text-xs text-slate-400 mt-0.5">{block.label}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <BlockActions id={block.id} active={block.active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
