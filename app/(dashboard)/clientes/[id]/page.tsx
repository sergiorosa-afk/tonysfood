import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Phone, Mail, StickyNote, CalendarDays, Clock, MessageSquare, TrendingUp, Pencil } from 'lucide-react'
import { getCustomerById } from '@/lib/queries/customers'
import { CustomerSegmentBadge } from '@/components/customers/customer-segment-badge'
import { CustomerTimeline } from '@/components/customers/customer-timeline'
import { CustomerTagsEditor } from '@/components/customers/customer-tags-editor'
import { CustomerPreferencesEditor } from '@/components/customers/customer-preferences-editor'
import { SuggestionsPanel } from '@/components/catalog/suggestions-panel'
import { AICustomerSummary } from '@/components/customers/ai-customer-summary'
import { getInitials } from '@/lib/utils'
import { auth } from '@/lib/auth'
import { getSegmentByName } from '@/lib/queries/segments'

export const dynamic = 'force-dynamic'

const SEGMENT_GRADIENT_FALLBACK: Record<string, string> = {
  amber:  'from-amber-400 to-amber-600',
  blue:   'from-blue-400 to-blue-600',
  green:  'from-green-400 to-green-600',
  slate:  'from-slate-300 to-slate-500',
  purple: 'from-purple-400 to-purple-600',
  red:    'from-red-400 to-red-600',
  orange: 'from-orange-400 to-orange-600',
  pink:   'from-pink-400 to-pink-600',
  indigo: 'from-indigo-400 to-indigo-600',
  teal:   'from-teal-400 to-teal-600',
}

export default async function ClienteDetailPage({ params }: { params: { id: string } }) {
  const [customer, session] = await Promise.all([getCustomerById(params.id), auth()])
  if (!customer) notFound()

  const unitId = (session?.user as any)?.unitId
  const initials = getInitials(customer.name)
  const preferences = (customer.preferences as string[] | null) ?? []
  const restrictions = (customer.restrictions as string[] | null) ?? []

  const segmentRecord = await getSegmentByName(customer.segment)
  const segmentColor = segmentRecord?.color ?? 'slate'
  const segmentGradient = SEGMENT_GRADIENT_FALLBACK[segmentColor] ?? 'from-slate-400 to-slate-600'

  const completedReservations = customer.reservations.filter(
    r => r.status === 'COMPLETED' || r.status === 'CHECKED_IN'
  ).length
  const noShows = customer.reservations.filter(r => r.status === 'NO_SHOW').length
  const openConversations = customer.conversations.filter(
    c => c.status === 'OPEN' || c.status === 'PENDING'
  ).length

  return (
    <div className="max-w-6xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/clientes"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Clientes
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-800 font-medium">{customer.name}</span>

        <Link
          href={`/clientes/${customer.id}/editar`}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors shadow-sm"
        >
          <Pencil className="w-3.5 h-3.5" />
          Editar
        </Link>
      </div>

      {/* Profile header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-5 flex-wrap">
          {/* Avatar */}
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${segmentGradient} flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg`}>
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
              <CustomerSegmentBadge
                segment={customer.segment}
                label={segmentRecord?.label}
                color={segmentRecord?.color}
              />
            </div>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {customer.phone && (
                <span className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {customer.phone}
                </span>
              )}
              {customer.email && (
                <span className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {customer.email}
                </span>
              )}
            </div>
            {customer.notes && (
              <p className="mt-2 text-sm text-slate-500 flex items-start gap-1.5">
                <StickyNote className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
                {customer.notes}
              </p>
            )}
          </div>

          {/* Stats chips */}
          <div className="flex gap-3 flex-wrap">
            <div className="text-center px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-2xl font-bold text-slate-900">{customer.visitCount}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Visitas</p>
            </div>
            <div className="text-center px-4 py-2.5 bg-green-50 rounded-xl border border-green-200">
              <p className="text-2xl font-bold text-green-700">{completedReservations}</p>
              <p className="text-[10px] text-green-600 mt-0.5">Reservas OK</p>
            </div>
            {noShows > 0 && (
              <div className="text-center px-4 py-2.5 bg-red-50 rounded-xl border border-red-200">
                <p className="text-2xl font-bold text-red-600">{noShows}</p>
                <p className="text-[10px] text-red-500 mt-0.5">No-shows</p>
              </div>
            )}
            {openConversations > 0 && (
              <div className="text-center px-4 py-2.5 bg-violet-50 rounded-xl border border-violet-200">
                <p className="text-2xl font-bold text-violet-700">{openConversations}</p>
                <p className="text-[10px] text-violet-600 mt-0.5">Conversas ativas</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: tags + preferences + info */}
        <div className="space-y-5">
          {/* Tags */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Tags</h3>
            <CustomerTagsEditor customerId={customer.id} tags={customer.tags} />
          </div>

          {/* Preferences & restrictions */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Preferências & Restrições</h3>
            <CustomerPreferencesEditor
              customerId={customer.id}
              initialPreferences={preferences}
              initialRestrictions={restrictions}
            />
          </div>

          {/* AI Summary */}
          <AICustomerSummary customerId={customer.id} />

          {/* Catalog suggestions */}
          <SuggestionsPanel
            preferences={preferences}
            restrictions={restrictions}
            unitId={unitId}
          />

          {/* Quick facts */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Informações</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Última visita</span>
                <span className="text-xs font-medium text-slate-700">
                  {customer.lastVisitAt
                    ? new Date(customer.lastVisitAt).toLocaleDateString('pt-BR')
                    : 'Nunca'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Reservas</span>
                <span className="text-xs font-medium text-slate-700">{customer.reservations.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Entradas na fila</span>
                <span className="text-xs font-medium text-slate-700">{customer.queueEntries.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Conversas</span>
                <span className="text-xs font-medium text-slate-700">{customer.conversations.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Cadastrado em</span>
                <span className="text-xs font-medium text-slate-700">
                  {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Unidade</span>
                <span className="text-xs font-medium text-slate-700 truncate max-w-[140px]">{customer.unit.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: timeline */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900">Histórico Completo</h3>
              <span className="ml-auto text-xs text-slate-400">
                {customer.reservations.length + customer.queueEntries.length + customer.conversations.length} eventos
              </span>
            </div>

            {/* Summary by type */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Reservas',  count: customer.reservations.length,  Icon: CalendarDays,  color: 'text-green-600 bg-green-50' },
                { label: 'Fila',      count: customer.queueEntries.length,   Icon: Clock,         color: 'text-yellow-600 bg-yellow-50' },
                { label: 'Conversas', count: customer.conversations.length,  Icon: MessageSquare, color: 'text-violet-600 bg-violet-50' },
              ].map(({ label, count, Icon, color }) => (
                <div key={label} className="text-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mx-auto mb-1.5`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold text-slate-900">{count}</p>
                  <p className="text-[10px] text-slate-500">{label}</p>
                </div>
              ))}
            </div>

            <CustomerTimeline
              reservations={customer.reservations}
              queueEntries={customer.queueEntries}
              conversations={customer.conversations as any}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
