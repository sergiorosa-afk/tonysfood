'use client'


import { useFormState, useFormStatus } from 'react-dom'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import { createMessageTemplate, updateMessageTemplate } from '@/lib/actions/automations'

const CATEGORIES = [
  { value: 'confirmation', label: 'Confirmação' },
  { value: 'reminder',     label: 'Lembrete' },
  { value: 'welcome',      label: 'Boas-vindas' },
  { value: 'queue',        label: 'Fila / Espera' },
  { value: 'cancellation', label: 'Cancelamento' },
  { value: 'general',      label: 'Geral' },
]

const VARIABLE_HINTS = [
  '{{guestName}}', '{{partySize}}', '{{date}}', '{{time}}',
  '{{estimatedWait}}', '{{unitName}}', '{{position}}',
]

type Template = {
  id: string
  name: string
  category: string
  body: string
  variables: unknown
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      {isEdit ? 'Salvar Alterações' : 'Criar Template'}
    </button>
  )
}

export function TemplateFormClient({ template }: { template?: Template }) {
  const router = useRouter()
  const isEdit = !!template

  const action = isEdit
    ? updateMessageTemplate.bind(null, template.id)
    : createMessageTemplate

  const [state, formAction] = useFormState(action, null)

  useEffect(() => {
    if ((state as any)?.success) router.push('/automacao?tab=templates')
  }, [state, router])

  return (
    <form action={formAction} className="space-y-6">
      {(state as any)?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {(state as any).error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Dados do Template</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Nome *</label>
            <input
              name="name"
              defaultValue={template?.name}
              required
              placeholder="Ex: Confirmação de reserva"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Categoria *</label>
            <select
              name="category"
              defaultValue={template?.category ?? 'general'}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">Corpo da mensagem *</label>
            </div>

            {/* Variable hints */}
            <div className="flex flex-wrap gap-1 mb-2">
              {VARIABLE_HINTS.map((v) => (
                <span key={v} className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 font-mono cursor-default">
                  {v}
                </span>
              ))}
              <span className="text-[10px] text-slate-400 self-center">← use estas variáveis no corpo</span>
            </div>

            <textarea
              name="body"
              defaultValue={template?.body}
              required
              rows={6}
              placeholder={`Olá {{guestName}}! Sua reserva para {{partySize}} pessoas está confirmada. Até logo! 😊`}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none font-mono"
            />
            <p className="text-xs text-slate-400">
              Use {'{{variavel}}'} para inserir dados dinâmicos. Variáveis detectadas automaticamente ao salvar.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <SubmitButton isEdit={isEdit} />
      </div>
    </form>
  )
}
