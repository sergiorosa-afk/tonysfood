'use client'

import { useEffect, useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { X, Loader2, UserPlus } from 'lucide-react'
import { joinQueue, QueueFormState } from '@/lib/actions/queue'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      form="queue-add-form"
      disabled={pending}
      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
      {pending ? 'Adicionando...' : 'Adicionar à Fila'}
    </button>
  )
}

const inputClass = "w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all"
const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5"

interface QueueAddFormProps {
  unitId: string
  open: boolean
  onClose: () => void
}

export function QueueAddForm({ unitId, open, onClose }: QueueAddFormProps) {
  const [state, formAction] = useFormState<QueueFormState, FormData>(joinQueue, {})
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
      onClose()
    }
  }, [state.success, onClose])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Adicionar à Fila</h2>
              <p className="text-xs text-slate-500">Cadastre o cliente na fila de espera</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form id="queue-add-form" ref={formRef} action={formAction} className="flex-1 overflow-y-auto p-6 space-y-4">
          <input type="hidden" name="unitId" value={unitId} />

          {state.message && !state.success && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {state.message}
            </div>
          )}

          <div>
            <label className={labelClass}>Nome *</label>
            <input name="guestName" placeholder="Nome do cliente" className={inputClass} required />
            {state.errors?.guestName && <p className="text-xs text-red-500 mt-1">{state.errors.guestName[0]}</p>}
          </div>

          <div>
            <label className={labelClass}>Telefone / WhatsApp</label>
            <input name="guestPhone" placeholder="(11) 99999-0000" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Número de Pessoas *</label>
            <div className="flex items-center gap-3">
              <input
                name="partySize"
                type="number"
                min="1"
                max="50"
                defaultValue={2}
                className={inputClass}
                required
              />
            </div>
            {state.errors?.partySize && <p className="text-xs text-red-500 mt-1">{state.errors.partySize[0]}</p>}
          </div>

          <div>
            <label className={labelClass}>Canal de Entrada</label>
            <select name="channel" defaultValue="IN_PERSON" className={inputClass}>
              <option value="IN_PERSON">Presencial</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="PHONE">Telefone</option>
              <option value="APP">App</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Observações</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Ex: aniversário, cadeirante, prefere área externa..."
              className={`${inputClass} resize-none`}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <SubmitButton />
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </>
  )
}
