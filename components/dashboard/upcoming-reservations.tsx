import { CalendarDays, Users, Phone, MessageCircle, Instagram, Globe, MonitorSmartphone } from 'lucide-react'

type Reservation = {
  id: string
  guestName: string
  guestPhone: string | null
  date: Date
  partySize: number
  status: string
  channel: string
  customer: {
    segment: string
    tags: { tag: string }[]
  } | null
}

const channelIcon = {
  PHONE: Phone,
  WHATSAPP: MessageCircle,
  INSTAGRAM: Instagram,
  WEBSITE: Globe,
  APP: MonitorSmartphone,
  WALK_IN: Users,
}

const statusConfig = {
  PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: 'Confirmada', color: 'bg-green-100 text-green-700' },
  CHECKED_IN: { label: 'Check-in', color: 'bg-blue-100 text-blue-700' },
  CANCELLED: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
  NO_SHOW: { label: 'No-show', color: 'bg-slate-100 text-slate-600' },
  COMPLETED: { label: 'Concluída', color: 'bg-slate-100 text-slate-600' },
}

export function UpcomingReservations({ reservations }: { reservations: Reservation[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Próximas Reservas</h3>
            <p className="text-xs text-slate-500">Hoje, a partir de agora</p>
          </div>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {reservations.length} reserva{reservations.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="divide-y divide-slate-50">
        {reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-6">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
              <CalendarDays className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">Nenhuma reserva para hoje</p>
          </div>
        ) : (
          reservations.map((res) => {
            const status = statusConfig[res.status as keyof typeof statusConfig]
            const ChannelIcon = channelIcon[res.channel as keyof typeof channelIcon] || Phone
            const isVip = res.customer?.segment === 'VIP'

            return (
              <div key={res.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/50 transition-colors">
                {/* Time */}
                <div className="w-14 flex-shrink-0 text-center">
                  <p className="text-sm font-bold text-slate-900">
                    {new Date(res.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 truncate">{res.guestName}</p>
                    {isVip && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 flex-shrink-0">VIP</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {res.partySize} pessoas
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <ChannelIcon className="w-3 h-3" />
                      {res.channel === 'WHATSAPP' ? 'WhatsApp' : res.channel === 'PHONE' ? 'Telefone' : res.channel}
                    </span>
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
