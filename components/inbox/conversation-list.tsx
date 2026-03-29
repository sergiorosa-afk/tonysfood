import Link from 'next/link'
import { getConversations, getInboxStats } from '@/lib/queries/inbox'
import { ConversationStatusBadge } from './conversation-status-badge'
import { NewConversationButton } from './new-conversation-button'
import { MessageCircle, Search } from 'lucide-react'

function timeAgo(date: Date | null) {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

type Props = {
  unitId?: string
  status?: string
  q?: string
  activeId?: string
}

export async function ConversationList({ unitId, status, q, activeId }: Props) {
  const [conversations, stats] = await Promise.all([
    getConversations({ unitId, status, q }),
    getInboxStats(unitId),
  ])

  const statusTabs = [
    { key: 'all',      label: 'Todas',     count: stats.total },
    { key: 'OPEN',     label: 'Abertas',   count: stats.open },
    { key: 'PENDING',  label: 'Pendentes', count: stats.pending },
    { key: 'RESOLVED', label: 'Resolvidas',count: stats.resolved },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 shrink-0 relative">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-base font-bold text-slate-900">Inbox</h1>
          <div className="flex items-center gap-1.5">
            {stats.open > 0 && (
              <span className="w-5 h-5 rounded-full bg-green-600 text-white text-[10px] font-bold flex items-center justify-center">
                {stats.open > 9 ? '9+' : stats.open}
              </span>
            )}
            <NewConversationButton />
          </div>
        </div>

        {/* Search */}
        <form>
          {status && status !== 'all' && <input type="hidden" name="status" value={status} />}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar conversa..."
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50"
            />
          </div>
        </form>

        {/* Status tabs */}
        <div className="flex gap-1 mt-3">
          {statusTabs.map((tab) => (
            <Link
              key={tab.key}
              href={`/inbox?${tab.key !== 'all' ? `status=${tab.key}` : ''}${q ? `&q=${q}` : ''}`}
              className={`flex-1 text-center px-1.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                (status ?? 'all') === tab.key
                  ? 'bg-green-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-0.5 ${(status ?? 'all') === tab.key ? 'text-green-200' : 'text-slate-400'}`}>
                  {tab.count}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Nenhuma conversa</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const lastMsg = conv.messages[0]
            const isActive = conv.id === activeId
            const isUnread = conv.status === 'OPEN' && lastMsg?.direction === 'INBOUND'

            return (
              <Link
                key={conv.id}
                href={`/inbox/${conv.id}${status ? `?status=${status}` : ''}`}
                className={`block px-4 py-3.5 border-b border-slate-100 transition-colors hover:bg-slate-50 ${
                  isActive ? 'bg-green-50 border-l-2 border-l-green-600' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    conv.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                    conv.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {(conv.customer?.name ?? conv.guestName ?? conv.guestPhone)
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-sm truncate ${isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {conv.customer?.name ?? conv.guestName ?? conv.guestPhone}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {timeAgo(conv.lastMessageAt ?? conv.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {lastMsg
                        ? (lastMsg.direction === 'OUTBOUND' ? '↑ ' : '') + lastMsg.content
                        : conv.guestPhone}
                    </p>

                    <div className="flex items-center gap-1.5 mt-1">
                      <ConversationStatusBadge status={conv.status} size="xs" />
                      {isUnread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      )}
                      {conv.customer?.segment === 'VIP' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-700">VIP</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
