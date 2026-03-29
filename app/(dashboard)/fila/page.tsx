import { Users, Clock, CheckCircle, XCircle } from 'lucide-react'
import { getQueueEntries, getQueueHistory, getQueueStats } from '@/lib/queries/queue'
import { QueueEntryCard } from '@/components/queue/queue-entry-card'
import { QueueStatusBadge } from '@/components/queue/queue-status-badge'
import { QueueAutoRefresh } from '@/components/queue/queue-auto-refresh'
import { QueuePageClient } from '@/components/queue/queue-page-client'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function FilaPage() {
  const unit = await prisma.unit.findFirst({ where: { active: true } })
  const unitId = unit?.id

  const [entries, history, stats] = await Promise.all([
    getQueueEntries(unitId),
    getQueueHistory(unitId, 10),
    getQueueStats(unitId),
  ])

  const waiting = entries.filter(e => e.status === 'WAITING')
  const called  = entries.filter(e => e.status === 'CALLED')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fila de Espera</h1>
          <p className="text-slate-500 mt-1 text-sm">Painel operacional em tempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <QueueAutoRefresh interval={30000} />
          <QueuePageClient unitId={unitId ?? ''} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Aguardando',   value: stats.waiting,   Icon: Clock,        color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Chamados',     value: stats.called,    Icon: Users,        color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Sentados',     value: stats.seated,    Icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Desistências', value: stats.abandoned, Icon: XCircle,      color: 'text-red-500',    bg: 'bg-red-50' },
        ].map(({ label, value, Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ETA banner */}
      {stats.waiting > 0 && stats.avgEstimatedWait > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center gap-3">
          <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            Tempo médio de espera estimado:
            <span className="font-bold ml-1">~{stats.avgEstimatedWait} minutos</span>
          </p>
        </div>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Active queue — takes 2/3 */}
        <div className="xl:col-span-2 space-y-4">
          {/* Called section */}
          {called.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" />
                Chamados ({called.length})
              </h2>
              <div className="space-y-3">
                {called.map((entry) => (
                  <QueueEntryCard key={entry.id} entry={entry as any} />
                ))}
              </div>
            </div>
          )}

          {/* Waiting section */}
          <div>
            <h2 className="text-xs font-semibold text-yellow-600 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
              Aguardando ({waiting.length})
            </h2>

            {waiting.length === 0 && called.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">Fila vazia</p>
                <p className="text-xs text-slate-400 mt-1">Nenhum cliente aguardando no momento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {waiting.map((entry) => (
                  <QueueEntryCard key={entry.id} entry={entry as any} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* History sidebar — takes 1/3 */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Histórico Recente
          </h2>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {history.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-xs text-slate-400">Sem registros hoje</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {history.map((entry) => {
                  const endTime = entry.seatedAt ?? (entry as any).abandonedAt ?? null
                  const waitMinutes = endTime
                    ? Math.floor((new Date(endTime).getTime() - new Date(entry.createdAt).getTime()) / 60000)
                    : null

                  return (
                    <div key={entry.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-500">
                        {entry.guestName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">{entry.guestName}</p>
                        <p className="text-[10px] text-slate-400">
                          {entry.partySize} pax
                          {waitMinutes !== null && ` · ${waitMinutes} min`}
                        </p>
                      </div>
                      <QueueStatusBadge status={entry.status} size="xs" />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
