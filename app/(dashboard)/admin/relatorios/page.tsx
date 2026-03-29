export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { getQueueReport, getReservationReport, getCustomerSegmentReport } from '@/lib/queries/reports'
import { getSegments } from '@/lib/queries/segments'
import { getSegmentColors } from '@/lib/segment-colors'
import {
  Users, CalendarDays, ListOrdered, TrendingDown,
  Clock, Star, BarChart3, UserCheck, XCircle, CheckCircle,
} from 'lucide-react'
import Link from 'next/link'

const PERIOD_OPTIONS = [
  { value: '7',  label: '7 dias' },
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
]

const CHANNEL_LABELS: Record<string, string> = {
  WHATSAPP: 'WhatsApp', PHONE: 'Telefone', IN_PERSON: 'Presencial',
  APP: 'Aplicativo', ONLINE: 'Online',
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500 w-6 text-right">{value}</span>
    </div>
  )
}

function SparkBar({ data, color }: { data: { date: string; count: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex items-end gap-0.5 h-10 w-full">
      {data.map(({ date, count }) => (
        <div
          key={date}
          title={`${date}: ${count}`}
          className={`flex-1 rounded-sm ${color} opacity-80 min-h-[2px]`}
          style={{ height: `${Math.max((count / max) * 100, count > 0 ? 8 : 2)}%` }}
        />
      ))}
    </div>
  )
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: { periodo?: string }
}) {
  const session = await auth()
  const unitId  = (session?.user as any)?.unitId as string
  const days    = parseInt(searchParams.periodo ?? '30', 10)

  const [queue, reservations, customers, segments] = await Promise.all([
    getQueueReport(unitId, days),
    getReservationReport(unitId, days),
    getCustomerSegmentReport(unitId),
    getSegments(),
  ])

  const segmentMap = Object.fromEntries(segments.map(s => [s.name, s]))

  return (
    <div className="space-y-8">
      {/* Header + filtro */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
          <p className="text-sm text-slate-500 mt-0.5">Visão geral de ocupação, reservas e clientes</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
          {PERIOD_OPTIONS.map(opt => (
            <Link
              key={opt.value}
              href={`/admin/relatorios?periodo=${opt.value}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                String(days) === opt.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── SEÇÃO 1: Ocupação da Fila ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Ocupação da Fila</h2>
          <span className="text-xs text-slate-400">últimos {days} dias</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total na fila',       value: queue.total,        icon: ListOrdered,  color: 'bg-teal-100 text-teal-600' },
            { label: 'Pessoas atendidas',   value: queue.totalPeople,  icon: UserCheck,    color: 'bg-green-100 text-green-600' },
            { label: 'Espera média (min)',  value: queue.avgWait,      icon: Clock,        color: 'bg-blue-100 text-blue-600' },
            { label: 'Taxa desistência',    value: `${queue.abandonment}%`, icon: TrendingDown, color: 'bg-red-100 text-red-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">{value}</p>
                  <p className="text-[11px] text-slate-500 leading-tight">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-700">Entradas por dia</p>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-green-400 inline-block" /> Sentados ({queue.seated})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-300 inline-block" /> Desistências ({queue.abandoned})
              </span>
            </div>
          </div>
          <SparkBar data={queue.byDay} color="bg-teal-400" />
          <div className="flex justify-between mt-1.5 text-[10px] text-slate-300">
            <span>{queue.byDay[0]?.date?.slice(5)}</span>
            <span>{queue.byDay[Math.floor(queue.byDay.length / 2)]?.date?.slice(5)}</span>
            <span>{queue.byDay[queue.byDay.length - 1]?.date?.slice(5)}</span>
          </div>

          {/* Status breakdown */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Na fila agora',  value: queue.waiting,   color: 'bg-yellow-400' },
              { label: 'Chamados',       value: queue.called,    color: 'bg-blue-400' },
              { label: 'Sentados',       value: queue.seated,    color: 'bg-green-400' },
              { label: 'Desistiram',     value: queue.abandoned, color: 'bg-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <MiniBar value={value} max={queue.total} color={color} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 2: Reservas por Período ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Reservas por Período</h2>
          <span className="text-xs text-slate-400">últimos {days} dias</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total reservas',     value: reservations.total,      icon: CalendarDays, color: 'bg-indigo-100 text-indigo-600' },
            { label: 'Confirmadas',        value: reservations.confirmed,  icon: CheckCircle,  color: 'bg-green-100 text-green-600' },
            { label: 'Cancelamentos',      value: reservations.cancelled,  icon: XCircle,      color: 'bg-red-100 text-red-600' },
            { label: 'Taxa cancelamento',  value: `${reservations.cancelRate}%`, icon: TrendingDown, color: 'bg-orange-100 text-orange-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">{value}</p>
                  <p className="text-[11px] text-slate-500 leading-tight">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Evolução diária */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-sm font-semibold text-slate-700 mb-4">Reservas por dia</p>
            <SparkBar data={reservations.byDay} color="bg-indigo-400" />
            <div className="flex justify-between mt-1.5 text-[10px] text-slate-300">
              <span>{reservations.byDay[0]?.date?.slice(5)}</span>
              <span>{reservations.byDay[Math.floor(reservations.byDay.length / 2)]?.date?.slice(5)}</span>
              <span>{reservations.byDay[reservations.byDay.length - 1]?.date?.slice(5)}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
              <span>Grupo médio: <strong className="text-slate-700">{reservations.avgParty} pax</strong></span>
              <span>Check-ins: <strong className="text-slate-700">{reservations.checkedIn}</strong></span>
              <span>Pendentes: <strong className="text-slate-700">{reservations.pending}</strong></span>
            </div>
          </div>

          {/* Por canal */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-sm font-semibold text-slate-700 mb-4">Por canal</p>
            {reservations.byChannel.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Sem dados no período</p>
            ) : (
              <div className="space-y-3">
                {reservations.byChannel.map(({ channel, count }) => (
                  <div key={channel}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600">{CHANNEL_LABELS[channel] ?? channel}</span>
                      <span className="text-xs font-semibold text-slate-700">
                        {reservations.total > 0 ? Math.round((count / reservations.total) * 100) : 0}%
                      </span>
                    </div>
                    <MiniBar value={count} max={reservations.total} color="bg-indigo-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 3: Clientes VIP ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Clientes por Segmento</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Breakdown por segmento */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-700">Distribuição</p>
              <span className="text-xs text-slate-400">{customers.totalCustomers} clientes · {customers.newThisMonth} novos (30d)</span>
            </div>
            {customers.bySegment.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhum cliente cadastrado</p>
            ) : (
              <div className="space-y-3">
                {customers.bySegment.map(({ segment, count, pct }) => {
                  const seg = segmentMap[segment]
                  const colors = seg ? getSegmentColors(seg.color) : null
                  return (
                    <div key={segment}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {colors ? (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${colors.badge}`}>
                              {seg?.label ?? segment}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">{segment}</span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{pct}%</span>
                      </div>
                      <MiniBar value={count} max={customers.totalCustomers} color="bg-amber-400" />
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Top VIP */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-700">Top Clientes VIP</p>
              <Link href="/clientes" className="text-xs text-slate-400 hover:text-slate-600">Ver todos</Link>
            </div>
            {customers.vipCustomers.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhum cliente VIP cadastrado</p>
            ) : (
              <div className="space-y-1">
                {customers.vipCustomers.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      i === 0 ? 'bg-amber-100 text-amber-700' :
                      i === 1 ? 'bg-slate-100 text-slate-600' :
                      i === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-slate-50 text-slate-400'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                      <p className="text-xs text-slate-400 truncate">{c.email ?? c.phone}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
                      <span title="Visitas na fila" className="flex items-center gap-0.5">
                        <ListOrdered className="w-3 h-3" />
                        {c._count.queueEntries}
                      </span>
                      <span title="Reservas" className="flex items-center gap-0.5">
                        <CalendarDays className="w-3 h-3" />
                        {c._count.reservations}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Rodapé informativo */}
      <p className="text-xs text-slate-300 text-center pb-4">
        <BarChart3 className="w-3 h-3 inline mr-1" />
        Dados da sua unidade · Atualizado em tempo real
      </p>
    </div>
  )
}
