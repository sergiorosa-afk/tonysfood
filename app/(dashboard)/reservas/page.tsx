import Link from 'next/link'
import { Plus, CalendarDays, Clock, CheckCircle, LogIn } from 'lucide-react'
import { getReservations, getReservationCounts } from '@/lib/queries/reservations'
import { ReservationStatusBadge } from '@/components/reservations/reservation-status-badge'
import { ReservationChannelBadge } from '@/components/reservations/reservation-channel-badge'
import { ReservationActions } from '@/components/reservations/reservation-actions'

export const dynamic = 'force-dynamic'

const dateLabels = {
  today: 'Hoje',
  tomorrow: 'Amanhã',
  week: 'Próximos 7 dias',
  all: 'Todos',
}

const statusOptions = [
  { value: 'all', label: 'Todos os status' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'CONFIRMED', label: 'Confirmada' },
  { value: 'CHECKED_IN', label: 'Check-in' },
  { value: 'CANCELLED', label: 'Cancelada' },
  { value: 'NO_SHOW', label: 'No-show' },
  { value: 'COMPLETED', label: 'Concluída' },
]

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: { date?: string; status?: string; q?: string }
}) {
  const date = (searchParams.date as any) || 'today'
  const status = searchParams.status || 'all'
  const q = searchParams.q || ''

  const [reservations, counts] = await Promise.all([
    getReservations({ date, status, q }),
    getReservationCounts(),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reservas</h1>
          <p className="text-slate-500 mt-1 text-sm">Gerencie as reservas do restaurante</p>
        </div>
        <Link
          href="/reservas/nova"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors shadow-sm shadow-green-900/20"
        >
          <Plus className="w-4 h-4" />
          Nova Reserva
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Hoje', value: counts.total, Icon: CalendarDays, color: 'text-slate-700' },
          { label: 'Pendentes', value: counts.pending, Icon: Clock, color: 'text-yellow-600' },
          { label: 'Confirmadas', value: counts.confirmed, Icon: CheckCircle, color: 'text-green-600' },
          { label: 'Check-in', value: counts.checkedIn, Icon: LogIn, color: 'text-blue-600' },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
            <div>
              <p className="text-xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <form className="flex flex-wrap gap-3">
          <input type="hidden" name="date" value={date} />
          {/* Date filter */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {(['today', 'tomorrow', 'week', 'all'] as const).map((d) => (
              <a
                key={d}
                href={`/reservas?date=${d}&status=${status}&q=${q}`}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  date === d
                    ? 'bg-green-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {dateLabels[d]}
              </a>
            ))}
          </div>

          {/* Status filter */}
          <select
            name="status"
            defaultValue={status}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Search */}
          <div className="flex-1 min-w-48">
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar por nome..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
              <CalendarDays className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">Nenhuma reserva encontrada</p>
            <p className="text-xs text-slate-400 mt-1">Tente ajustar os filtros ou crie uma nova reserva</p>
            <Link
              href="/reservas/nova"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Reserva
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Horário</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Convidado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Pessoas</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Canal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reservations.map((res) => {
                const isVip = res.customer?.segment === 'VIP'
                return (
                  <tr key={res.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">
                        {new Date(res.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(res.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/reservas/${res.id}`} className="group-hover:text-green-700 transition-colors">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900">{res.guestName}</p>
                          {isVip && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">VIP</span>
                          )}
                        </div>
                        {res.guestPhone && (
                          <p className="text-xs text-slate-400 mt-0.5">{res.guestPhone}</p>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className="text-sm text-slate-700">{res.partySize} pax</span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <ReservationChannelBadge channel={res.channel} />
                    </td>
                    <td className="px-4 py-4">
                      <ReservationStatusBadge status={res.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <ReservationActions id={res.id} status={res.status} compact />
                        <Link
                          href={`/reservas/${res.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xs font-medium"
                        >
                          Ver
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {reservations.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-500">
              {reservations.length} reserva{reservations.length !== 1 ? 's' : ''} encontrada{reservations.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
