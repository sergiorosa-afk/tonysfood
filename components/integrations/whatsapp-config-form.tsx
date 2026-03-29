'use client'


import { useFormState, useFormStatus } from 'react-dom'
import { Loader2, Save, Eye, EyeOff, CheckCircle, Copy } from 'lucide-react'
import { saveWhatsappConfig } from '@/lib/actions/integrations'
import { useState } from 'react'

type Integration = {
  id: string
  active: boolean
  config: unknown
} | null

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      Salvar Configuração
    </button>
  )
}

export function WhatsappConfigForm({
  integration,
  webhookUrl,
}: {
  integration: Integration
  webhookUrl: string
}) {
  const [state, formAction] = useFormState(saveWhatsappConfig, null)
  const [showToken, setShowToken] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [copied, setCopied] = useState(false)

  const cfg = (integration?.config ?? {}) as Record<string, string>

  function copyUrl() {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <form action={formAction} className="space-y-6">
      {(state as any)?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {(state as any).error}
        </div>
      )}
      {(state as any)?.success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Configuração salva com sucesso!
        </div>
      )}

      {/* Webhook URL (read-only) */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">URL do Webhook (configurar no Meta)</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs text-blue-900 bg-white border border-blue-200 rounded-lg px-3 py-2 font-mono break-all">
            {webhookUrl}
          </code>
          <button
            type="button"
            onClick={copyUrl}
            className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors shrink-0"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[11px] text-blue-600">
          Configure esta URL no painel Meta Developers → WhatsApp → Configuração → Webhooks
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Credenciais Meta / WhatsApp Business</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Phone Number ID *</label>
            <input
              name="phoneNumberId"
              defaultValue={cfg.phoneNumberId ?? ''}
              required
              placeholder="123456789012345"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
            />
            <p className="text-xs text-slate-400">Meta Developers → WhatsApp → Getting Started</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Nome do negócio</label>
            <input
              name="businessName"
              defaultValue={cfg.businessName ?? ''}
              placeholder="Ex: Tony's Food"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Access Token (permanente) *</label>
            <div className="relative">
              <input
                name="accessToken"
                type={showToken ? 'text' : 'password'}
                defaultValue={cfg.accessToken ?? ''}
                required
                placeholder="EAAxxxx..."
                className="w-full px-3.5 py-2.5 pr-11 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Verify Token *</label>
            <input
              name="verifyToken"
              defaultValue={cfg.verifyToken ?? ''}
              required
              placeholder="token-secreto-para-verificacao"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
            />
            <p className="text-xs text-slate-400">Token que você define e insere no Meta também</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">App Secret (HMAC)</label>
            <div className="relative">
              <input
                name="webhookSecret"
                type={showSecret ? 'text' : 'password'}
                defaultValue={cfg.webhookSecret ?? ''}
                placeholder="Opcional — para verificação de assinatura"
                className="w-full px-3.5 py-2.5 pr-11 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSecret((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-400">App Secret do Meta para validar assinatura HMAC-SHA256</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  )
}
