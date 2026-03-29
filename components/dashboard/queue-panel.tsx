import { Users, Clock } from 'lucide-react'

type QueueEntry = {
  id: string
  guestName: string
  partySize: number
  position: number
  status: string
  estimatedWait: number | null
  createdAt: Date
  customer: { segment: string } | null
}

const statusConfig = {
  WAITING: { label: 'Aguardando', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  CALLED: { label: 'Chamado', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
  SEATED: { label: 'Sentado', color: 'bg-green-100 text-green-700', dot: 'bg-green-400' },
  ABANDONED: { label: 'Desistiu', color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
  TRANSFERRED: { label: 'Transferido', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400' },
}

export function QueuePanel({ entries }: { entries: QueueEntry[] }) {
  const waiting = entries.filter(e => e.status === 'WAITING').length
  const called = entries.filter(e => e.status === 'CALLED').length

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Fila de Espera</h3>
            <p className="text-xs text-slate-500">Situação em tempo real</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {called > 0 && (
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              {called} chamado{called !== 1 ? 's' : ''}
            </span>
          )}
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {waiting} aguardando
          </span>
        </div>
      </div>

      <div className="divide-y divide-slate-50">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-6">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">Fila vazia no momento</p>
          </div>
        ) : (
          entries.map((entry) => {
            const status = statusConfig[entry.status as keyof typeof statusConfig]
            const isVip = entry.customer?.segment === 'VIP'
            const waitMinutes = Math.floor((Date.now() - new Date(entry.createdAt).getTime()) / 60000)

            return (
              <div key={entry.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/50 transition-colors">
                {/* Position */}
                <div className="w-8 flex-shrink-0">
                  {entry.status === 'WAITING' ? (
                    <span className="text-sm font-bold text-slate-900">#{entry.position}</span>
                  ) : (
                    <span className={`w-2 h-2 rounded-full ${status?.dot} inline-block`} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 truncate">{entry.guestName}</p>
                    {isVip && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 flex-shrink-0">VIP</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {entry.partySize} pessoas
                    </span>
                    {entry.status === 'WAITING' && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {waitMinutes}min aguardando
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${status?.color}`}>
                  {status?.label}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
