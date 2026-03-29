import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Calendar, Users, Phone, MessageCircle, StickyNote, Utensils } from 'lucide-react'
import { getReservationById } from '@/lib/queries/reservations'
import { ReservationStatusBadge } from '@/components/reservations/reservation-status-badge'
import { ReservationChannelBadge } from '@/components/reservations/reservation-channel-badge'
import { ReservationActions } from '@/components/reservations/reservation-actions'
import { ReservationStatusHistory } from '@/components/reservations/reservation-status-history'
import { updateReservation } from '@/lib/actions/reservations'
import { ReservationForm } from '@/components/reservations/reservation-form'

export const dynamic = 'force-dynamic'

export default async function ReservaDetailPage({ params }: { params: { id: string } }) {
  const reservation = await getReservationById(params.id)
  if (!reservation) notFound()

  const dateObj = new Date(reservation.date)
  const dateStr = dateObj.toISOString().split('T')[0]
  const timeStr = dateObj.toTimeString().slice(0, 5)

  const updateWithId = updateReservation.bind(null, reservation.id)

  const isEditable = ['PENDING', 'CONFIRMED'].includes(reservation.status)

  return (
    <div className="max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/reservas" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Reservas
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-800 font-medium truncate">{reservation.guestName}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{reservation.guestName}</h1>
            {reservation.customer?.segment === 'VIP' && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-700">VIP</span>
            )}
            <ReservationStatusBadge status={reservation.status} size="sm" />
          </div>
          <p className="text-slate-500 mt-1 text-sm">
            {dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' às '}
            {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {isEditable && (
          <ReservationActions id={reservation.id} status={reservation.status} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: details + edit */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick info cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <Calendar className="w-4 h-4 text-slate-400 mb-2" />
              <p className="text-xs text-slate-500">Data</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <Users className="w-4 h-4 text-slate-400 mb-2" />
              <p className="text-xs text-slate-500">Pessoas</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{reservation.partySize} pax</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <Phone className="w-4 h-4 text-slate-400 mb-2" />
              <p className="text-xs text-slate-500">Telefone</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{reservation.guestPhone || '—'}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <MessageCircle className="w-4 h-4 text-slate-400 mb-2" />
              <p className="text-xs text-slate-500">Canal</p>
              <div className="mt-0.5"><ReservationChannelBadge channel={reservation.channel} /></div>
            </div>
          </div>

          {reservation.notes && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <StickyNote className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-800">Observações</h3>
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{reservation.notes}</p>
            </div>
          )}

          {reservation.tablePreference && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Utensils className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-800">Preferência de Mesa</h3>
              </div>
              <p className="text-sm text-slate-600">{reservation.tablePreference}</p>
            </div>
          )}

          {/* Edit form */}
          {isEditable && (
            <div>
              <h2 className="text-base font-semibold text-slate-900 mb-4">Editar Reserva</h2>
              <ReservationForm
                action={updateWithId}
                unitId={reservation.unitId}
                defaultValues={{
                  guestName: reservation.guestName,
                  guestPhone: reservation.guestPhone ?? '',
                  guestEmail: reservation.guestEmail ?? '',
                  date: dateStr,
                  time: timeStr,
                  partySize: reservation.partySize,
                  status: reservation.status,
                  channel: reservation.channel,
                  notes: reservation.notes ?? '',
                  tablePreference: reservation.tablePreference ?? '',
                }}
                submitLabel="Salvar Alterações"
              />
            </div>
          )}
        </div>

        {/* Right: status history + customer info */}
        <div className="space-y-6">
          {/* Status history */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Histórico de Status</h3>
            {reservation.statusHistory.length > 0 ? (
              <ReservationStatusHistory history={reservation.statusHistory as any} />
            ) : (
              <p className="text-xs text-slate-400">Nenhum histórico registrado.</p>
            )}
          </div>

          {/* Customer info (if linked) */}
          {reservation.customer && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Cliente Cadastrado</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {reservation.customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{reservation.customer.name}</p>
                  <p className="text-xs text-slate-500">{reservation.customer.visitCount} visitas</p>
                </div>
              </div>
              {reservation.customer.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {reservation.customer.tags.map((t) => (
                    <span key={t.tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                      {t.tag}
                    </span>
                  ))}
                </div>
              )}
              <Link
                href={`/clientes/${reservation.customer.id}`}
                className="mt-3 block text-xs text-green-600 hover:text-green-700 font-medium transition-colors"
              >
                Ver perfil completo →
              </Link>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">ID da reserva</p>
            <p className="text-xs font-mono text-slate-700 break-all">{reservation.id}</p>
            <p className="text-xs text-slate-500 mt-2 mb-1">Criada em</p>
            <p className="text-xs text-slate-700">
              {new Date(reservation.createdAt).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
