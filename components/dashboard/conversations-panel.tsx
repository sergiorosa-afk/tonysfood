import { MessageSquare } from 'lucide-react'

type Conversation = {
  id: string
  guestName: string | null
  guestPhone: string
  status: string
  lastMessageAt: Date | null
  customer: { name: string; segment: string } | null
  messages: { content: string; direction: string }[]
}

const statusConfig = {
  OPEN: { label: 'Aberta', color: 'bg-green-100 text-green-700' },
  PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
  RESOLVED: { label: 'Resolvida', color: 'bg-slate-100 text-slate-600' },
  CLOSED: { label: 'Fechada', color: 'bg-slate-100 text-slate-500' },
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'agora'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export function ConversationsPanel({ conversations }: { conversations: Conversation[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Conversas Ativas</h3>
            <p className="text-xs text-slate-500">WhatsApp em aberto</p>
          </div>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {conversations.length} ativa{conversations.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="divide-y divide-slate-50">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-6">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">Nenhuma conversa ativa</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const status = statusConfig[conv.status as keyof typeof statusConfig]
            const displayName = conv.customer?.name || conv.guestName || conv.guestPhone
            const lastMsg = conv.messages[0]
            const isVip = conv.customer?.segment === 'VIP'

            return (
              <div key={conv.id} className="flex items-start gap-4 px-6 py-3.5 hover:bg-slate-50/50 transition-colors">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold">
                  {displayName?.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
                      {isVip && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 flex-shrink-0">VIP</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {conv.lastMessageAt && (
                        <span className="text-xs text-slate-400">{timeAgo(conv.lastMessageAt)}</span>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${status?.color}`}>
                        {status?.label}
                      </span>
                    </div>
                  </div>
                  {lastMsg && (
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {lastMsg.direction === 'OUTBOUND' ? '↗ ' : ''}{lastMsg.content}
                    </p>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
