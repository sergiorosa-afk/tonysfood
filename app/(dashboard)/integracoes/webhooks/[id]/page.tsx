import { notFound } from 'next/navigation'
import { getWebhookById } from '@/lib/queries/integrations'
import { WebhookFormClient } from '@/components/integrations/webhook-form-client'
import { WebhookLogList } from '@/components/integrations/webhook-log'
import { ArrowLeft, Globe, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default async function EditWebhookPage({ params }: { params: { id: string } }) {
  const webhook = await getWebhookById(params.id)
  if (!webhook) notFound()

  const totalCalls = webhook.successCount + webhook.failureCount
  const successRate = totalCalls > 0
    ? Math.round((webhook.successCount / totalCalls) * 100)
    : null

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/integracoes?tab=webhooks"
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            webhook.active ? 'bg-blue-100' : 'bg-slate-100'
          }`}>
            <Globe className={`w-5 h-5 ${webhook.active ? 'text-blue-600' : 'text-slate-400'}`} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{webhook.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {webhook.active
                ? <><CheckCircle className="w-3.5 h-3.5 text-green-500" /><span className="text-xs text-green-600">Ativo</span></>
                : <><AlertCircle className="w-3.5 h-3.5 text-slate-400" /><span className="text-xs text-slate-500">Inativo</span></>
              }
              {successRate !== null && (
                <span className={`text-xs font-medium ml-1 ${
                  successRate >= 90 ? 'text-green-600' : successRate >= 70 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {successRate}% taxa de sucesso
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <WebhookFormClient webhook={webhook} />
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Últimas entregas
            <span className="ml-2 font-normal text-slate-400">({webhook.logs.length})</span>
          </h2>
          <WebhookLogList logs={webhook.logs as any} />
        </div>
      </div>
    </div>
  )
}
