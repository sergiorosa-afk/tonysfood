'use client'

import { useState, useEffect, useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { X, Loader2, UserPlus, UserCheck } from 'lucide-react'
import { joinQueue, QueueFormState } from '@/lib/actions/queue'

function SubmitButton({ submitting }: { submitting: boolean }) {
  const { pending } = useFormStatus()
  const blocked = pending || submitting
  return (
    <button
      type="submit"
      disabled={blocked}
      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {blocked ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
      {blocked ? 'Adicionando...' : 'Adicionar à Fila'}
    </button>
  )
}

type LookupState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found'; customer: { name: string; segment: string; visitCount: number } }
  | { status: 'new' }

const SEGMENT_LABEL: Record<string, string> = {
  VIP: 'VIP',
  REGULAR: 'Regular',
  NEW: 'Novo',
  INACTIVE: 'Inativo',
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [phone, setPhone] = useState('')
  const [lookup, setLookup] = useState<LookupState>({ status: 'idle' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
      setPhone('')
      setLookup({ status: 'idle' })
      setSubmitting(false)
      onClose()
    } else if (state.message && !state.success) {
      setSubmitting(false)
    }
  }, [state, onClose])

  useEffect(() => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) {
      setLookup({ status: 'idle' })
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLookup({ status: 'loading' })
      try {
        const res = await fetch(`/api/customers/lookup?phone=${encodeURIComponent(digits)}&unitId=${unitId}`)
        const data = await res.json()
        if (data.found) {
          setLookup({ status: 'found', customer: data.customer })
        } else {
          setLookup({ status: 'new' })
        }
      } catch {
        setLookup({ status: 'idle' })
      }
    }, 500)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [phone, unitId])

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
        <form ref={formRef} action={formAction} onSubmit={() => setSubmitting(true)} className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
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
            <input
              name="guestPhone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(11) 99999-0000"
              className={inputClass}
            />
            {/* Indicador de cliente */}
            {lookup.status === 'loading' && (
              <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5">
                <Loader2 className="w-3 h-3 animate-spin" /> Verificando...
              </p>
            )}
            {lookup.status === 'found' && (
              <p className="flex items-center gap-1.5 text-xs text-green-700 mt-1.5 font-medium">
                <UserCheck className="w-3.5 h-3.5" />
                Cliente cadastrado — {lookup.customer.name} · {SEGMENT_LABEL[lookup.customer.segment] ?? lookup.customer.segment}
                {lookup.customer.visitCount > 0 && ` · ${lookup.customer.visitCount} visita${lookup.customer.visitCount !== 1 ? 's' : ''}`}
              </p>
            )}
            {lookup.status === 'new' && (
              <p className="flex items-center gap-1.5 text-xs text-blue-600 mt-1.5 font-medium">
                <UserPlus className="w-3.5 h-3.5" />
                Cliente novo — será cadastrado automaticamente como Novo
              </p>
            )}
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

          {/* Footer dentro do form para useFormStatus funcionar */}
          <div className="mt-auto pt-4 border-t border-slate-100 flex gap-3">
            <SubmitButton submitting={submitting} />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
