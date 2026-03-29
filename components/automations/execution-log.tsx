import { CheckCircle, XCircle, SkipForward, Clock } from 'lucide-react'

type Log = {
  id: string
  status: string
  result: unknown
  error: string | null
  entityType: string | null
  entityId: string | null
  executedAt: Date
  rule: { id: string; name: string; triggerEvent: string }
}

const STATUS_CONFIG = {
  SUCCESS: { label: 'Sucesso',   icon: CheckCircle, classes: 'text-green-600 bg-green-50' },
  PARTIAL: { label: 'Parcial',   icon: XCircle,     classes: 'text-yellow-600 bg-yellow-50' },
  FAILED:  { label: 'Falhou',    icon: XCircle,     classes: 'text-red-600 bg-red-50' },
  SKIPPED: { label: 'Ignorado',  icon: SkipForward,  classes: 'text-slate-500 bg-slate-100' },
}

const TRIGGER_LABELS: Record<string, string> = {
  RESERVATION_CREATED:   'Reserva criada',
  RESERVATION_CONFIRMED: 'Reserva confirmada',
  RESERVATION_CANCELLED: 'Reserva cancelada',
  RESERVATION_CHECKIN:   'Check-in',
  QUEUE_JOINED:          'Entrou na fila',
  QUEUE_CALLED:          'Chamado',
  QUEUE_SEATED:          'Sentou',
  QUEUE_ABANDONED:       'Desistiu',
  CONVERSATION_OPENED:   'Nova conversa',
  CUSTOMER_CREATED:      'Cliente cadastrado',
}

function formatTime(date: Date) {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export function ExecutionLog({ logs }: { logs: Log[] }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-400">Nenhuma execução registrada ainda</p>
        <p className="text-xs text-slate-400 mt-1">Os logs aparecerão aqui quando as regras forem acionadas</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const cfg = STATUS_CONFIG[log.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.FAILED
        const Icon = cfg.icon
        const results = log.result as { action: string; ok: boolean; detail: string }[] | null

        return (
          <div key={log.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.classes}`}>
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{log.rule.name}</p>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.classes}`}>
                    {cfg.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs text-slate-500">
                    {TRIGGER_LABELS[log.rule.triggerEvent] ?? log.rule.triggerEvent}
                  </span>
                  {log.entityType && log.entityId && (
                    <span className="text-xs text-slate-400 font-mono">
                      {log.entityType}/{log.entityId.slice(-6)}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 ml-auto">
                    {formatTime(log.executedAt)}
                  </span>
                </div>

                {/* Action results */}
                {results && results.length > 0 && log.status !== 'SKIPPED' && (
                  <div className="mt-2 space-y-1">
                    {results.map((r, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        {r.ok
                          ? <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                          : <XCircle className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                        }
                        <span className="text-[11px] text-slate-500">{r.detail}</span>
                      </div>
                    ))}
                  </div>
                )}

                {log.status === 'SKIPPED' && (
                  <p className="text-xs text-slate-400 mt-1 italic">Condições não atendidas</p>
                )}

                {log.error && (
                  <p className="text-xs text-red-600 mt-1">{log.error}</p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
