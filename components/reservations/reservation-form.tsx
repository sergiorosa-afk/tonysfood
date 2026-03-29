'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import type { ReservationFormState } from '@/lib/actions/reservations'

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {pending ? 'Salvando...' : label}
    </button>
  )
}

interface ReservationFormProps {
  action: (prevState: ReservationFormState, formData: FormData) => Promise<ReservationFormState>
  defaultValues?: {
    guestName?: string
    guestPhone?: string
    guestEmail?: string
    date?: string
    time?: string
    partySize?: number
    status?: string
    channel?: string
    notes?: string
    tablePreference?: string
  }
  unitId: string
  submitLabel?: string
}

const inputClass = "w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all"
const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5"
const errorClass = "text-xs text-red-500 mt-1"

export function ReservationForm({ action, defaultValues = {}, unitId, submitLabel = 'Salvar Reserva' }: ReservationFormProps) {
  const [state, formAction] = useFormState(action, {})

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="unitId" value={unitId} />

      {state.message && !state.success && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {state.message}
        </div>
      )}

      {/* Guest info */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Dados do Convidado</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Nome *</label>
            <input
              name="guestName"
              defaultValue={defaultValues.guestName}
              placeholder="Nome completo"
              className={inputClass}
              required
            />
            {state.errors?.guestName && <p className={errorClass}>{state.errors.guestName[0]}</p>}
          </div>
          <div>
            <label className={labelClass}>Telefone / WhatsApp</label>
            <input
              name="guestPhone"
              defaultValue={defaultValues.guestPhone}
              placeholder="(11) 99999-0000"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>E-mail</label>
            <input
              name="guestEmail"
              type="email"
              defaultValue={defaultValues.guestEmail}
              placeholder="email@exemplo.com"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Reservation details */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Detalhes da Reserva</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Data *</label>
            <input
              name="date"
              type="date"
              defaultValue={defaultValues.date}
              className={inputClass}
              required
            />
            {state.errors?.date && <p className={errorClass}>{state.errors.date[0]}</p>}
          </div>
          <div>
            <label className={labelClass}>Horário *</label>
            <input
              name="time"
              type="time"
              defaultValue={defaultValues.time}
              className={inputClass}
              required
            />
            {state.errors?.time && <p className={errorClass}>{state.errors.time[0]}</p>}
          </div>
          <div>
            <label className={labelClass}>Número de Pessoas *</label>
            <input
              name="partySize"
              type="number"
              min="1"
              max="200"
              defaultValue={defaultValues.partySize ?? 2}
              className={inputClass}
              required
            />
            {state.errors?.partySize && <p className={errorClass}>{state.errors.partySize[0]}</p>}
          </div>
          <div>
            <label className={labelClass}>Mesa / Preferência</label>
            <input
              name="tablePreference"
              defaultValue={defaultValues.tablePreference}
              placeholder="ex: Mesa 5, Varanda..."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Canal</label>
            <select name="channel" defaultValue={defaultValues.channel ?? 'PHONE'} className={inputClass}>
              <option value="PHONE">Telefone</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="WALK_IN">Presencial</option>
              <option value="APP">App</option>
              <option value="WEBSITE">Website</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select name="status" defaultValue={defaultValues.status ?? 'PENDING'} className={inputClass}>
              <option value="PENDING">Pendente</option>
              <option value="CONFIRMED">Confirmada</option>
              <option value="CHECKED_IN">Check-in</option>
              <option value="CANCELLED">Cancelada</option>
              <option value="NO_SHOW">No-show</option>
              <option value="COMPLETED">Concluída</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Observações</label>
            <textarea
              name="notes"
              defaultValue={defaultValues.notes}
              rows={3}
              placeholder="Informações adicionais, preferências, ocasião especial..."
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton label={submitLabel} />
        <a
          href="/reservas"
          className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
