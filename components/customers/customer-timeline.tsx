import { CalendarDays, Clock, MessageSquare } from 'lucide-react'
import { ReservationStatusBadge } from '@/components/reservations/reservation-status-badge'
import { QueueStatusBadge } from '@/components/queue/queue-status-badge'

type TimelineEvent =
  | { type: 'reservation'; date: Date; data: { id: string; date: Date; partySize: number; status: string; channel: string; guestName: string } }
  | { type: 'queue';       date: Date; data: { id: string; createdAt: Date; partySize: number; status: string; estimatedWait: number | null; guestName: string } }
  | { type: 'conversation';date: Date; data: { id: string; status: string; guestPhone: string; lastMessageAt: Date | null; messages: { content: string; direction: string }[] } }

const channelLabel: Record<string, string> = {
  PHONE: 'Telefone', WHATSAPP: 'WhatsApp', INSTAGRAM: 'Instagram',
  WALK_IN: 'Presencial', APP: 'App', WEBSITE: 'Website',
}

function timeAgo(date: Date) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  if (days < 7) return `${days} dias atrás`
  if (days < 30) return `${Math.floor(days / 7)} sem. atrás`
  if (days < 365) return `${Math.floor(days / 30)} meses atrás`
  return `${Math.floor(days / 365)} ano(s) atrás`
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function CustomerTimeline({
  reservations,
  queueEntries,
  conversations,
}: {
  reservations: any[]
  queueEntries: any[]
  conversations: any[]
}) {
  const events: TimelineEvent[] = [
    ...reservations.map(r => ({ type: 'reservation' as const, date: new Date(r.date), data: r })),
    ...queueEntries.map(q => ({ type: 'queue' as const, date: new Date(q.createdAt), data: q })),
    ...conversations.map(c => ({ type: 'conversation' as const, date: new Date(c.lastMessageAt ?? c.createdAt), data: c })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  if (events.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-slate-400">Nenhuma atividade registrada</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {events.map((event, index) => (
        <div key={`${event.type}-${event.data.id}`} className="flex gap-3 group">
          {/* Icon + line */}
          <div className="flex flex-col items-center">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
              event.type === 'reservation' ? 'bg-green-50 text-green-600' :
              event.type === 'queue' ? 'bg-yellow-50 text-yellow-600' :
              'bg-violet-50 text-violet-600'
            )}>
              {event.type === 'reservation' && <CalendarDays className="w-3.5 h-3.5" />}
              {event.type === 'queue' && <Clock className="w-3.5 h-3.5" />}
              {event.type === 'conversation' && <MessageSquare className="w-3.5 h-3.5" />}
            </div>
            {index < events.length - 1 && (
              <div className="w-px flex-1 bg-slate-100 my-1" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-4 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {event.type === 'reservation' && (
                  <>
                    <p className="text-sm font-medium text-slate-800">
                      Reserva — {event.data.partySize} pessoas
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(event.data.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {' · '}{channelLabel[event.data.channel] ?? event.data.channel}
                    </p>
                    <div className="mt-1">
                      <ReservationStatusBadge status={event.data.status} size="xs" />
                    </div>
                  </>
                )}

                {event.type === 'queue' && (
                  <>
                    <p className="text-sm font-medium text-slate-800">
                      Fila de Espera — {event.data.partySize} pessoas
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(event.data.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {event.data.estimatedWait ? ` · ETA ~${event.data.estimatedWait} min` : ''}
                    </p>
                    <div className="mt-1">
                      <QueueStatusBadge status={event.data.status} size="xs" />
                    </div>
                  </>
                )}

                {event.type === 'conversation' && (
                  <>
                    <p className="text-sm font-medium text-slate-800">
                      Conversa WhatsApp
                    </p>
                    {event.data.messages?.[0] && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                        {event.data.messages[0].direction === 'OUTBOUND' ? '↗ ' : '↙ '}
                        {event.data.messages[0].content}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {event.data.guestPhone}
                    </p>
                  </>
                )}
              </div>

              <span className="text-[10px] text-slate-400 flex-shrink-0 mt-1">
                {timeAgo(event.date)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
