'use client'

import { useState, useTransition } from 'react'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { getAICustomerSummary } from '@/lib/actions/ai'

export function AICustomerSummary({ customerId }: { customerId: string }) {
  const [summary, setSummary] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [generated, setGenerated] = useState(false)

  function generate() {
    setError(null)
    startTransition(async () => {
      const result = await getAICustomerSummary(customerId)
      if ('error' in result && result.error) {
        setError(result.error)
        return
      }
      setSummary((result as any).summary ?? null)
      setGenerated(true)
    })
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">Resumo IA</h3>
        </div>
        <button
          onClick={generate}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : generated ? (
            <RefreshCw className="w-3.5 h-3.5" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {generated ? 'Regenerar' : 'Gerar'}
        </button>
      </div>

      {!generated && !isPending && (
        <p className="text-xs text-slate-400 italic">
          Clique em &quot;Gerar&quot; para criar um resumo inteligente do perfil deste cliente.
        </p>
      )}

      {isPending && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Analisando perfil...
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {summary && !isPending && (
        <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
      )}
    </div>
  )
}
