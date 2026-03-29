import { CheckCircle, XCircle, LogIn, AlertTriangle, Clock, CheckSquare } from 'lucide-react'

const statusConfig = {
  PENDING:    { label: 'Pendente',   Icon: Clock,          color: 'text-yellow-600 bg-yellow-50 ring-yellow-200' },
  CONFIRMED:  { label: 'Confirmada', Icon: CheckCircle,    color: 'text-green-600 bg-green-50 ring-green-200' },
  CANCELLED:  { label: 'Cancelada',  Icon: XCircle,        color: 'text-red-500 bg-red-50 ring-red-200' },
  NO_SHOW:    { label: 'No-show',    Icon: AlertTriangle,  color: 'text-slate-500 bg-slate-100 ring-slate-200' },
  CHECKED_IN: { label: 'Check-in',   Icon: LogIn,          color: 'text-blue-600 bg-blue-50 ring-blue-200' },
  COMPLETED:  { label: 'Concluída',  Icon: CheckSquare,    color: 'text-slate-600 bg-slate-100 ring-slate-200' },
}

type HistoryEntry = {
  id: string
  status: string
  notes: string | null
  createdAt: Date
}

export function ReservationStatusHistory({ history }: { history: HistoryEntry[] }) {
  return (
    <div className="space-y-3">
      {history.map((entry, index) => {
        const config = statusConfig[entry.status as keyof typeof statusConfig]
        if (!config) return null
        const { label, Icon, color } = config

        return (
          <div key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ring-1 flex-shrink-0 ${color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              {index < history.length - 1 && (
                <div className="w-px flex-1 bg-slate-200 mt-1.5 mb-0" />
              )}
            </div>
            <div className="pb-4 min-w-0">
              <p className="text-sm font-medium text-slate-800">{label}</p>
              {entry.notes && (
                <p className="text-xs text-slate-500 mt-0.5">{entry.notes}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                {new Date(entry.createdAt).toLocaleString('pt-BR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
