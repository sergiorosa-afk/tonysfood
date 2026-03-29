import Link from 'next/link'
import {
  Phone, Mail, User, CalendarDays, Tag,
  Users, ExternalLink, Hash
} from 'lucide-react'
import { CustomerSegmentBadge } from '@/components/customers/customer-segment-badge'
import { ReservationStatusBadge } from '@/components/reservations/reservation-status-badge'
import { formatDate } from '@/lib/utils'

type Customer = {
  id: string
  name: string
  phone: string | null
  email: string | null
  segment: string
  visitCount: number
  tags: { id: string; tag: string }[]
  preferences: unknown
  restrictions: unknown
  reservations: {
    id: string
    date: Date
    partySize: number
    status: string
  }[]
}

type Conversation = {
  id: string
  guestName: string | null
  guestPhone: string
  status: string
  assignedTo: string | null
  createdAt: Date
  customer: Customer | null
}

export function CustomerSummaryPanel({ conversation }: { conversation: Conversation }) {
  const customer = conversation.customer
  const preferences = (customer?.preferences as string[]) ?? []
  const restrictions = (customer?.restrictions as string[]) ?? []

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      {/* Contact info */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        {customer ? (
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {customer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{customer.name}</p>
                  <CustomerSegmentBadge segment={customer.segment} />
                </div>
              </div>
              <Link
                href={`/clientes/${customer.id}`}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Ver perfil"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-1.5">
              {customer.phone && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {customer.phone}
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {customer.email}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {customer.visitCount} visitas
              </div>
            </div>

            {customer.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {customer.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600"
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {tag.tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-700 text-sm">
                  {conversation.guestName ?? 'Desconhecido'}
                </p>
                <p className="text-xs text-slate-400">Não cadastrado</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {conversation.guestPhone}
            </div>
            <Link
              href={`/clientes/novo?phone=${encodeURIComponent(conversation.guestPhone)}`}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              Cadastrar cliente
            </Link>
          </div>
        )}
      </div>

      {/* Preferences */}
      {(preferences.length > 0 || restrictions.length > 0) && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Preferências</p>
          {preferences.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {preferences.map((p) => (
                <span key={p} className="px-2 py-0.5 rounded-full text-[10px] bg-green-50 text-green-700">
                  {p}
                </span>
              ))}
            </div>
          )}
          {restrictions.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-400 mb-1">Restrições</p>
              <div className="flex flex-wrap gap-1">
                {restrictions.map((r) => (
                  <span key={r} className="px-2 py-0.5 rounded-full text-[10px] bg-red-50 text-red-700">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent reservations */}
      {customer && customer.reservations.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Reservas Recentes
          </p>
          <div className="space-y-2">
            {customer.reservations.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-600 truncate">
                    {formatDate(r.date)}
                  </span>
                  <span className="flex items-center gap-0.5 text-xs text-slate-400">
                    <Users className="w-3 h-3" />
                    {r.partySize}
                  </span>
                </div>
                <ReservationStatusBadge status={r.status} size="xs" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversation info */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Conversa
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Hash className="w-3 h-3" />
              ID
            </span>
            <span className="text-slate-600 font-mono text-[10px]">{conversation.id.slice(-8)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Aberta em</span>
            <span className="text-slate-600">{formatDate(conversation.createdAt)}</span>
          </div>
          {conversation.assignedTo && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Atribuída a</span>
              <span className="text-slate-600 truncate max-w-[120px]">{conversation.assignedTo}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
