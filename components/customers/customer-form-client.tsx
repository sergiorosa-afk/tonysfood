'use client'


import { useFormState, useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import type { CustomerFormState } from '@/lib/actions/customers'

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {pending ? 'Salvando...' : label}
    </button>
  )
}

const inputClass = 'w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all'
const labelClass = 'block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5'

interface Props {
  action: (prev: CustomerFormState, form: FormData) => Promise<CustomerFormState>
  unitId: string
  segments: { name: string; label: string; color: string }[]
  defaultValues?: {
    name?: string
    phone?: string
    email?: string
    notes?: string
    segment?: string
  }
  submitLabel?: string
}

export function CustomerFormClient({ action, unitId, segments, defaultValues = {}, submitLabel = 'Criar Cliente' }: Props) {
  const [state, formAction] = useFormState(action, {})

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="unitId" value={unitId} />

      {state.message && !state.success && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {state.message}
        </div>
      )}
      {state.success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {state.message}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Dados do Cliente</h3>

        <div>
          <label className={labelClass}>Nome *</label>
          <input
            name="name"
            defaultValue={defaultValues.name}
            placeholder="Nome completo"
            className={inputClass}
            required
          />
          {state.errors?.name && (
            <p className="text-xs text-red-500 mt-1">{state.errors.name[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Telefone</label>
            <input
              name="phone"
              defaultValue={defaultValues.phone}
              placeholder="(11) 99999-0000"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>E-mail</label>
            <input
              name="email"
              type="email"
              defaultValue={defaultValues.email}
              placeholder="email@exemplo.com"
              className={inputClass}
            />
            {state.errors?.email && (
              <p className="text-xs text-red-500 mt-1">{state.errors.email[0]}</p>
            )}
          </div>
        </div>

        <div>
          <label className={labelClass}>Segmento</label>
          <select
            name="segment"
            defaultValue={defaultValues.segment ?? 'REGULAR'}
            className={inputClass}
          >
            {segments.map(seg => (
              <option key={seg.name} value={seg.name}>{seg.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Observações</label>
          <textarea
            name="notes"
            defaultValue={defaultValues.notes}
            rows={3}
            placeholder="Informações relevantes sobre o cliente..."
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton label={submitLabel} />
        <a
          href="/clientes"
          className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
