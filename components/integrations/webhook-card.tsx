'use client'

import { useState, useTransition } from 'react'
import {
  Globe, Pencil, Trash2, ToggleLeft, ToggleRight,
  Loader2, XCircle, Send, CheckCircle, AlertCircle, Clock
} from 'lucide-react'
import { toggleWebhook, deleteWebhook, testWebhook } from '@/lib/actions/integrations'
import Link from 'next/link'

type Webhook = {
  id: string
  name: string
  url: string
  events: unknown
  active: boolean
  lastCalledAt: Date | null
  successCount: number
  failureCount: number
  _count: { logs: number }
}

export function WebhookCard({ webhook }: { webhook: Webhook }) {
  const [isPending, startTransition] = useTransition()
  const [showDelete, setShowDelete] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; statusCode: number | null; response: string | null } | null>(null)

  const events = (webhook.events as string[]) ?? []
  const totalCalls = webhook.successCount + webhook.failureCount
  const successRate = totalCalls > 0 ? Math.round((webhook.successCount / totalCalls) * 100) : null

  function handleToggle() {
    startTransition(async () => { await toggleWebhook(webhook.id, !webhook.active) })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteWebhook(webhook.id)
      setShowDelete(false)
    })
  }

  function handleTest() {
    setTestResult(null)
    startTransition(async () => {
      const result = await testWebhook(webhook.id)
      if (result) setTestResult(result as any)
    })
  }

  const urlDisplay = webhook.url.length > 50
    ? webhook.url.slice(0, 47) + '…'
    : webhook.url

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${!webhook.active ? 'opacity-60' : ''}`}>
      {webhook.active && (
        <div className="h-0.5 bg-gradient-to-r from-blue-400 to-blue-600" />
      )}

      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            webhook.active ? 'bg-blue-100' : 'bg-slate-100'
          }`}>
            <Globe className={`w-4 h-4 ${webhook.active ? 'text-blue-600' : 'text-slate-400'}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-slate-900">{webhook.name}</p>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                webhook.active ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {webhook.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-1 font-mono truncate" title={webhook.url}>
              {urlDisplay}
            </p>

            {/* Events */}
            <div className="flex flex-wrap gap-1 mt-2">
              {events.slice(0, 4).map((e) => (
                <span key={e} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-mono">
                  {e.replace(/_/g, ' ').toLowerCase()}
                </span>
              ))}
              {events.length > 4 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500">
                  +{events.length - 4} mais
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                {webhook.successCount} ok
              </span>
              {webhook.failureCount > 0 && (
                <span className="flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  {webhook.failureCount} falhas
                </span>
              )}
              {successRate !== null && (
                <span className={`font-medium ${successRate >= 90 ? 'text-green-600' : successRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {successRate}% taxa
                </span>
              )}
              {webhook.lastCalledAt && (
                <span className="flex items-center gap-1 ml-auto">
                  <Clock className="w-3 h-3" />
                  {new Date(webhook.lastCalledAt).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Test result */}
        {testResult && (
          <div className={`mt-3 p-3 rounded-lg text-xs border ${
            testResult.success
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <p className="font-semibold">
              {testResult.success ? '✓ Teste bem-sucedido' : '✗ Teste falhou'} — HTTP {testResult.statusCode ?? 'timeout'}
            </p>
            {testResult.response && (
              <p className="mt-1 font-mono opacity-80 truncate">{testResult.response}</p>
            )}
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center gap-1 mt-4">
          <button
            onClick={handleToggle}
            disabled={isPending}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors disabled:opacity-50"
            title={webhook.active ? 'Desativar' : 'Ativar'}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : webhook.active ? (
              <ToggleRight className="w-4 h-4 text-blue-600" />
            ) : (
              <ToggleLeft className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={handleTest}
            disabled={isPending || !webhook.active}
            className="inline-flex items-center gap-1 p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 text-xs"
            title="Enviar teste"
          >
            <Send className="w-3.5 h-3.5" />
          </button>

          <div className="flex-1" />

          <Link
            href={`/integracoes/webhooks/${webhook.id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => setShowDelete(true)}
            disabled={isPending}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {showDelete && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
            <p className="text-xs font-semibold text-red-700">Excluir &quot;{webhook.name}&quot;?</p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                Excluir
              </button>
              <button onClick={() => setShowDelete(false)} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs hover:bg-slate-50">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
