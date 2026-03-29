import { notFound } from 'next/navigation'
import { getConversationById } from '@/lib/queries/inbox'
import { MessageThread } from '@/components/inbox/message-thread'
import { ComposerWithAI } from '@/components/inbox/composer-with-ai'
import { CustomerSummaryPanel } from '@/components/inbox/customer-summary-panel'
import { ConversationStatusBadge } from '@/components/inbox/conversation-status-badge'
import { ConversationActions } from '@/components/inbox/conversation-actions'
import { Phone, MessageCircle } from 'lucide-react'

export default async function InboxConversationPage({ params }: { params: { id: string } }) {
  const conversation = await getConversationById(params.id)
  if (!conversation) notFound()

  const isClosed = conversation.status === 'CLOSED'
  const displayName = conversation.customer?.name ?? conversation.guestName ?? conversation.guestPhone

  return (
    <>
      {/* Center: message thread */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200 bg-slate-50">
        {/* Thread header */}
        <div className="bg-white border-b border-slate-200 px-5 py-3.5 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{displayName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Phone className="w-3 h-3" />
                    {conversation.guestPhone}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <MessageCircle className="w-3 h-3" />
                    {conversation.channel}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <ConversationStatusBadge status={conversation.status} />
              <ConversationActions
                conversationId={conversation.id}
                status={conversation.status}
              />
            </div>
          </div>
        </div>

        {/* Messages */}
        <MessageThread messages={conversation.messages} />

        {/* Composer — disabled for closed conversations */}
        {isClosed ? (
          <div className="border-t border-slate-200 bg-white px-5 py-4 text-center shrink-0">
            <p className="text-sm text-slate-400">Esta conversa está fechada.</p>
          </div>
        ) : (
          <ComposerWithAI conversationId={conversation.id} />
        )}
      </div>

      {/* Right: customer summary */}
      <div className="w-72 bg-white flex-shrink-0 overflow-hidden">
        <CustomerSummaryPanel conversation={{
          id: conversation.id,
          guestName: conversation.guestName,
          guestPhone: conversation.guestPhone,
          status: conversation.status,
          assignedTo: conversation.assignedTo,
          createdAt: conversation.createdAt,
          customer: conversation.customer
            ? {
                id: conversation.customer.id,
                name: conversation.customer.name,
                phone: (conversation.customer as any).phone ?? null,
                email: (conversation.customer as any).email ?? null,
                segment: conversation.customer.segment,
                visitCount: (conversation.customer as any).visitCount ?? 0,
                tags: conversation.customer.tags.map((t) => ({ id: t.id, tag: t.tag })),
                preferences: (conversation.customer as any).preferences,
                restrictions: (conversation.customer as any).restrictions,
                reservations: conversation.customer.reservations,
              }
            : null,
        }} />
      </div>
    </>
  )
}
