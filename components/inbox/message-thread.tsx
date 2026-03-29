import { MessageCircle } from 'lucide-react'

type Message = {
  id: string
  content: string
  direction: string
  senderName: string | null
  readAt: Date | null
  createdAt: Date
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatDateLabel(date: Date) {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Hoje'
  if (d.toDateString() === yesterday.toDateString()) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
}

export function MessageThread({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Nenhuma mensagem ainda</p>
        </div>
      </div>
    )
  }

  // Group messages by date
  const grouped: { label: string; messages: Message[] }[] = []
  let currentDate = ''

  for (const msg of messages) {
    const dateLabel = formatDateLabel(msg.createdAt)
    if (dateLabel !== currentDate) {
      currentDate = dateLabel
      grouped.push({ label: dateLabel, messages: [] })
    }
    grouped[grouped.length - 1].messages.push(msg)
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4" id="message-thread">
      {grouped.map((group) => (
        <div key={group.label}>
          {/* Date divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] text-slate-400 font-medium px-2">{group.label}</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="space-y-2">
            {group.messages.map((msg, i) => {
              const isOutbound = msg.direction === 'OUTBOUND'
              const prevMsg = i > 0 ? group.messages[i - 1] : null
              const showSender = !prevMsg || prevMsg.direction !== msg.direction

              return (
                <div
                  key={msg.id}
                  className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[72%] ${isOutbound ? 'items-end' : 'items-start'} flex flex-col`}>
                    {showSender && !isOutbound && (
                      <span className="text-[10px] text-slate-400 mb-1 ml-1">
                        {msg.senderName ?? 'Cliente'}
                      </span>
                    )}
                    {showSender && isOutbound && (
                      <span className="text-[10px] text-slate-400 mb-1 mr-1 text-right">
                        {msg.senderName ?? 'Atendente'}
                      </span>
                    )}

                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isOutbound
                          ? 'bg-green-600 text-white rounded-br-sm'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {msg.content}
                    </div>

                    <div className={`flex items-center gap-1 mt-0.5 ${isOutbound ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[10px] text-slate-400">{formatTime(msg.createdAt)}</span>
                      {isOutbound && msg.readAt && (
                        <span className="text-[10px] text-blue-400">✓✓</span>
                      )}
                      {isOutbound && !msg.readAt && (
                        <span className="text-[10px] text-slate-400">✓</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
