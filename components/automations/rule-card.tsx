'use client'

import { useTransition } from 'react'
import { Zap, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toggleAutomationRule, deleteAutomationRule } from '@/lib/actions/automations'
import Link from 'next/link'
import { useState } from 'react'

const TRIGGER_LABELS: Record<string, string> = {
  RESERVATION_CREATED:   'Reserva criada',
  RESERVATION_CONFIRMED: 'Reserva confirmada',
  RESERVATION_CANCELLED: 'Reserva cancelada',
  RESERVATION_CHECKIN:   'Check-in realizado',
  QUEUE_JOINED:          'Entrou na fila',
  QUEUE_CALLED:          'Chamado na fila',
  QUEUE_SEATED:          'Sentou na mesa',
  QUEUE_ABANDONED:       'Desistiu da fila',
  CONVERSATION_OPENED:   'Nova conversa',
  CUSTOMER_CREATED:      'Cliente cadastrado',
}

const ACTION_LABELS: Record<string, string> = {
  SEND_MESSAGE:        'Enviar mensagem',
  SEND_CATALOG_OFFERS: 'Ofertas do cardápio',
  ADD_TAG:             'Adicionar tag',
  UPDATE_SEGMENT:      'Atualizar segmento',
  NOTIFY_STAFF:        'Notificar equipe',
}

type Rule = {
  id: string
  name: string
  description: string | null
  active: boolean
  triggerEvent: string
  actions: unknown
  executionCount: number
  lastExecutedAt: Date | null
  _count: { logs: number }
}

export function RuleCard({ rule }: { rule: Rule }) {
  const [isPending, startTransition] = useTransition()
  const [showDelete, setShowDelete] = useState(false)
  const actions = rule.actions as { type: string }[]

  function handleToggle() {
    startTransition(async () => { await toggleAutomationRule(rule.id, !rule.active) })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteAutomationRule(rule.id)
      setShowDelete(false)
    })
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
      rule.active ? 'border-slate-200' : 'border-slate-200 opacity-60'
    }`}>
      {rule.active && (
        <div className="h-0.5 bg-gradient-to-r from-green-400 to-green-600" />
      )}

      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            rule.active ? 'bg-green-100' : 'bg-slate-100'
          }`}>
            <Zap className={`w-4 h-4 ${rule.active ? 'text-green-600' : 'text-slate-400'}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{rule.name}</p>
                {rule.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{rule.description}</p>
                )}
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                rule.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {rule.active ? 'Ativa' : 'Inativa'}
              </span>
            </div>

            {/* Trigger + actions summary */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                <Zap className="w-3 h-3" />
                {TRIGGER_LABELS[rule.triggerEvent] ?? rule.triggerEvent}
              </span>
              <span className="text-slate-300 text-xs">→</span>
              {actions.map((a, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium">
                  {ACTION_LABELS[a.type] ?? a.type}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                {rule.executionCount} execuções
              </span>
              {rule.lastExecutedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  última: {new Date(rule.lastExecutedAt).toLocaleDateString('pt-BR')}
                </span>
              )}
              <span className="flex items-center gap-1">
                {rule._count.logs} logs
              </span>
            </div>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={handleToggle}
            disabled={isPending}
            title={rule.active ? 'Desativar' : 'Ativar'}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : rule.active ? (
              <ToggleRight className="w-4 h-4 text-green-600" />
            ) : (
              <ToggleLeft className="w-4 h-4" />
            )}
          </button>

          <Link
            href={`/automacao/${rule.id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => setShowDelete(true)}
            disabled={isPending}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {showDelete && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
            <p className="text-xs font-semibold text-red-700">Excluir &quot;{rule.name}&quot;?</p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                Excluir
              </button>
              <button
                onClick={() => setShowDelete(false)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
