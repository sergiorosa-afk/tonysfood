import { CheckCircle, XCircle, Clock, Globe } from 'lucide-react'

type Log = {
  id: string
  eventType: string
  statusCode: number | null
  response: string | null
  durationMs: number | null
  success: boolean
  createdAt: Date
  webhook: { id: string; name: string; url: string }
}

function formatTime(date: Date) {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export function WebhookLogList({ logs, showWebhookName = false }: { logs: Log[]; showWebhookName?: boolean }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <Globe className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-400">Nenhuma entrega registrada</p>
        <p className="text-xs text-slate-400 mt-1">Os logs aparecerão quando eventos forem disparados</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div key={log.id} className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              log.success ? 'bg-green-50' : 'bg-red-50'
            }`}>
              {log.success
                ? <CheckCircle className="w-4 h-4 text-green-600" />
                : <XCircle className="w-4 h-4 text-red-600" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {log.eventType}
                  </span>
                  {log.statusCode && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      log.statusCode < 300 ? 'bg-green-100 text-green-700'
                      : log.statusCode < 500 ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                      HTTP {log.statusCode}
                    </span>
                  )}
                  {!log.statusCode && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                      timeout/erro
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  {log.durationMs !== null && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {log.durationMs}ms
                    </span>
                  )}
                  <span>{formatTime(log.createdAt)}</span>
                </div>
              </div>

              {showWebhookName && (
                <p className="text-xs text-slate-500 mt-1 truncate">
                  → {log.webhook.name} <span className="text-slate-400 font-mono">{log.webhook.url.slice(0, 40)}…</span>
                </p>
              )}

              {log.response && (
                <p className="text-[11px] text-slate-400 mt-1.5 font-mono bg-slate-50 rounded px-2 py-1 truncate">
                  {log.response}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
