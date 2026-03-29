'use client'


import { useFormState, useFormStatus } from 'react-dom'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Eye, EyeOff } from 'lucide-react'
import { createWebhook, updateWebhook } from '@/lib/actions/integrations'

const EVENT_OPTIONS = [
  { group: 'Reservas', events: [
    { value: 'RESERVATION_CREATED',   label: 'Reserva criada' },
    { value: 'RESERVATION_CONFIRMED', label: 'Reserva confirmada' },
    { value: 'RESERVATION_CANCELLED', label: 'Reserva cancelada' },
    { value: 'RESERVATION_CHECKIN',   label: 'Check-in realizado' },
  ]},
  { group: 'Fila', events: [
    { value: 'QUEUE_JOINED',   label: 'Entrou na fila' },
    { value: 'QUEUE_CALLED',   label: 'Chamado na fila' },
    { value: 'QUEUE_SEATED',   label: 'Sentou na mesa' },
    { value: 'QUEUE_ABANDONED',label: 'Desistiu da fila' },
  ]},
  { group: 'Outros', events: [
    { value: 'CONVERSATION_OPENED', label: 'Nova conversa aberta' },
    { value: 'CUSTOMER_CREATED',    label: 'Cliente cadastrado' },
  ]},
]

type Webhook = {
  id: string
  name: string
  url: string
  secret: string | null
  events: unknown
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      {isEdit ? 'Salvar Alterações' : 'Criar Webhook'}
    </button>
  )
}

export function WebhookFormClient({ webhook }: { webhook?: Webhook }) {
  const router = useRouter()
  const isEdit = !!webhook

  const action = isEdit
    ? updateWebhook.bind(null, webhook.id)
    : createWebhook

  const [state, formAction] = useFormState(action, null)
  const [showSecret, setShowSecret] = useState(false)

  const activeEvents = (webhook?.events as string[]) ?? []

  useEffect(() => {
    if ((state as any)?.success) router.push('/integracoes')
  }, [state, router])

  return (
    <form action={formAction} className="space-y-6">
      {(state as any)?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {(state as any).error}
        </div>
      )}

      {/* Basic config */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Configuração</h2>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Nome *</label>
            <input
              name="name"
              defaultValue={webhook?.name}
              required
              placeholder="Ex: ERP Integração"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">URL de destino *</label>
            <input
              name="url"
              type="url"
              defaultValue={webhook?.url}
              required
              placeholder="https://meu-sistema.com/webhook"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Secret (HMAC)
              <span className="ml-2 text-xs text-slate-400 font-normal">opcional</span>
            </label>
            <div className="relative">
              <input
                name="secret"
                type={showSecret ? 'text' : 'password'}
                defaultValue={webhook?.secret ?? ''}
                placeholder="Chave secreta para assinar os payloads"
                className="w-full px-3.5 py-2.5 pr-11 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSecret((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Enviado como <code className="bg-slate-100 px-1 rounded">X-Signature: sha256=...</code> em cada request
            </p>
          </div>
        </div>
      </div>

      {/* Events */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Eventos subscritos</h2>

        <div className="space-y-5">
          {EVENT_OPTIONS.map((group) => (
            <div key={group.group}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{group.group}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.events.map((evt) => (
                  <label key={evt.value} className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      name={`event_${evt.value}`}
                      defaultChecked={activeEvents.includes(evt.value)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                    />
                    <span className="text-sm text-slate-700">{evt.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono ml-auto">{evt.value}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
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
