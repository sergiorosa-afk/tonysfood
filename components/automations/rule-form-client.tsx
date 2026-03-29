'use client'


import { useFormState, useFormStatus } from 'react-dom'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Plus, Trash2 } from 'lucide-react'
import { createAutomationRule, updateAutomationRule } from '@/lib/actions/automations'

const TRIGGER_EVENTS = [
  { value: 'RESERVATION_CREATED',   label: 'Reserva criada' },
  { value: 'RESERVATION_CONFIRMED', label: 'Reserva confirmada' },
  { value: 'RESERVATION_CANCELLED', label: 'Reserva cancelada' },
  { value: 'RESERVATION_CHECKIN',   label: 'Check-in realizado' },
  { value: 'QUEUE_JOINED',          label: 'Entrou na fila' },
  { value: 'QUEUE_CALLED',          label: 'Chamado na fila' },
  { value: 'QUEUE_SEATED',          label: 'Sentou na mesa' },
  { value: 'QUEUE_ABANDONED',       label: 'Desistiu da fila' },
  { value: 'CONVERSATION_OPENED',   label: 'Nova conversa aberta' },
  { value: 'CUSTOMER_CREATED',      label: 'Cliente cadastrado' },
]

const CONDITION_FIELDS = [
  { value: 'partySize', label: 'Tamanho do grupo' },
  { value: 'segment',   label: 'Segmento do cliente' },
  { value: 'channel',   label: 'Canal' },
  { value: 'guestName', label: 'Nome do convidado' },
]

const CONDITION_OPS = [
  { value: 'eq',       label: 'é igual a' },
  { value: 'neq',      label: 'não é igual a' },
  { value: 'gte',      label: 'maior ou igual a' },
  { value: 'lte',      label: 'menor ou igual a' },
  { value: 'contains', label: 'contém' },
]

const ACTION_TYPES = [
  { value: 'SEND_MESSAGE',        label: 'Enviar mensagem (template)' },
  { value: 'SEND_CATALOG_OFFERS', label: 'Enviar ofertas do cardápio (por segmento)' },
  { value: 'ADD_TAG',             label: 'Adicionar tag ao cliente' },
  { value: 'UPDATE_SEGMENT',      label: 'Atualizar segmento' },
  { value: 'NOTIFY_STAFF',        label: 'Notificar equipe' },
]

type Condition = { field: string; op: string; value: string }
type RuleAction = { type: string; templateId?: string; tag?: string; segment?: string; message?: string; introMessage?: string }

type Props = {
  rule?: {
    id: string
    name: string
    description: string | null
    triggerEvent: string
    conditions: unknown
    actions: unknown
  }
  templates: { id: string; name: string; category: string }[]
  segments: { name: string; label: string }[]
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
      {isEdit ? 'Salvar Alterações' : 'Criar Regra'}
    </button>
  )
}

export function RuleFormClient({ rule, templates, segments }: Props) {
  const router = useRouter()
  const isEdit = !!rule

  const action = isEdit
    ? updateAutomationRule.bind(null, rule.id)
    : createAutomationRule

  const [state, formAction] = useFormState(action, null)

  const [conditions, setConditions] = useState<Condition[]>(
    (rule?.conditions as Condition[]) ?? []
  )
  const [actions, setActions] = useState<RuleAction[]>(
    (rule?.actions as RuleAction[]) ?? [{ type: 'SEND_MESSAGE' }]
  )

  useEffect(() => {
    if ((state as any)?.success) router.push('/automacao')
  }, [state, router])

  function addCondition() {
    setConditions((prev) => [...prev, { field: 'partySize', op: 'gte', value: '' }])
  }
  function removeCondition(i: number) {
    setConditions((prev) => prev.filter((_, idx) => idx !== i))
  }
  function updateCondition(i: number, patch: Partial<Condition>) {
    setConditions((prev) => prev.map((c, idx) => idx === i ? { ...c, ...patch } : c))
  }

  function addAction() {
    setActions((prev) => [...prev, { type: 'SEND_MESSAGE' }])
  }
  function removeAction(i: number) {
    setActions((prev) => prev.filter((_, idx) => idx !== i))
  }
  function updateAction(i: number, patch: Partial<RuleAction>) {
    setActions((prev) => prev.map((a, idx) => idx === i ? { ...a, ...patch } : a))
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden JSON fields */}
      <input type="hidden" name="conditionsJson" value={JSON.stringify(conditions)} />
      <input type="hidden" name="actionsJson" value={JSON.stringify(actions)} />

      {(state as any)?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {(state as any).error}
        </div>
      )}

      {/* Basic info */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Identificação</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Nome da regra *</label>
            <input
              name="name"
              defaultValue={rule?.name}
              required
              placeholder="Ex: Confirmação automática VIP"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Evento gatilho *</label>
            <select
              name="triggerEvent"
              defaultValue={rule?.triggerEvent ?? ''}
              required
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">Selecione...</option>
              {TRIGGER_EVENTS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Descrição</label>
            <input
              name="description"
              defaultValue={rule?.description ?? ''}
              placeholder="Opcional — descreva o objetivo desta regra"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Conditions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Condições</h2>
            <p className="text-xs text-slate-400 mt-0.5">Todas as condições precisam ser verdadeiras (AND). Sem condições = sempre executar.</p>
          </div>
          <button
            type="button"
            onClick={addCondition}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </button>
        </div>

        {conditions.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">Sem condições — regra executa sempre.</p>
        ) : (
          <div className="space-y-2">
            {conditions.map((cond, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={cond.field}
                  onChange={(e) => updateCondition(i, { field: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  {CONDITION_FIELDS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
                <select
                  value={cond.op}
                  onChange={(e) => updateCondition(i, { op: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  {CONDITION_OPS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <input
                  value={cond.value}
                  onChange={(e) => updateCondition(i, { value: e.target.value })}
                  placeholder="valor"
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={() => removeCondition(i)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Ações</h2>
            <p className="text-xs text-slate-400 mt-0.5">Executadas em sequência quando as condições forem atendidas.</p>
          </div>
          <button
            type="button"
            onClick={addAction}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </button>
        </div>

        <div className="space-y-3">
          {actions.map((act, i) => (
            <div key={i} className="flex gap-2 items-start p-3 bg-slate-50 rounded-xl">
              <div className="flex-1 space-y-2">
                <select
                  value={act.type}
                  onChange={(e) => updateAction(i, { type: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  {ACTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>

                {act.type === 'SEND_MESSAGE' && (
                  <select
                    value={act.templateId ?? ''}
                    onChange={(e) => updateAction(i, { templateId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    <option value="">Selecione um template...</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                    ))}
                  </select>
                )}

                {act.type === 'ADD_TAG' && (
                  <input
                    value={act.tag ?? ''}
                    onChange={(e) => updateAction(i, { tag: e.target.value })}
                    placeholder="Nome da tag"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                )}

                {act.type === 'UPDATE_SEGMENT' && (
                  <select
                    value={act.segment ?? ''}
                    onChange={(e) => updateAction(i, { segment: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    <option value="">Selecione segmento...</option>
                    {segments.map((seg) => (
                      <option key={seg.name} value={seg.name}>{seg.label}</option>
                    ))}
                  </select>
                )}

                {act.type === 'NOTIFY_STAFF' && (
                  <input
                    value={act.message ?? ''}
                    onChange={(e) => updateAction(i, { message: e.target.value })}
                    placeholder="Mensagem de notificação"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                )}

                {act.type === 'SEND_CATALOG_OFFERS' && (
                  <div className="space-y-1.5">
                    <input
                      value={act.introMessage ?? ''}
                      onChange={(e) => updateAction(i, { introMessage: e.target.value })}
                      placeholder="Texto de introdução (opcional) — ex: 🎉 Temos ofertas especiais para você!"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-[10px] text-slate-400">
                      Envia via WhatsApp os itens do cardápio cujo segmento-alvo corresponde ao segmento do cliente.
                      O segmento é lido automaticamente do cadastro do cliente.
                      Se não preencher o texto de introdução, usa a mensagem padrão.
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeAction(i)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
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
