import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ReservationForm } from '@/components/reservations/reservation-form'
import { createReservation } from '@/lib/actions/reservations'
import { prisma } from '@/lib/db'

export default async function NovaReservaPage() {
  const unit = await prisma.unit.findFirst({ where: { active: true } })

  const today = new Date()
  const dateStr = today.toISOString().split('T')[0]
  const timeStr = '19:00'

  return (
    <div className="max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/reservas"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Reservas
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-800 font-medium">Nova Reserva</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nova Reserva</h1>
        <p className="text-slate-500 mt-1 text-sm">Preencha os dados para registrar uma nova reserva</p>
      </div>

      <ReservationForm
        action={createReservation}
        unitId={unit?.id ?? ''}
        defaultValues={{ date: dateStr, time: timeStr, partySize: 2, status: 'PENDING', channel: 'PHONE' }}
        submitLabel="Criar Reserva"
      />
    </div>
  )
}
