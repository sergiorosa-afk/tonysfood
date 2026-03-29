export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { getIntegrationByType } from '@/lib/queries/integrations'
import { WhatsappConfigForm } from '@/components/integrations/whatsapp-config-form'
import { ArrowLeft, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { headers } from 'next/headers'

export default async function WhatsappIntegrationPage() {
  const session = await auth()
  const unitId = (session?.user as any)?.unitId

  const integration = await getIntegrationByType(unitId, 'whatsapp')

  const headersList = headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const webhookUrl = `${proto}://${host}/api/webhooks/whatsapp`

  const cfg = (integration?.config ?? {}) as Record<string, string>

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/integracoes"
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-xl">
            💬
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">WhatsApp Business</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {integration?.active ? (
                <><CheckCircle className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-green-600">Conectado</span>
                {cfg.businessName && <span className="text-xs text-slate-400">— {cfg.businessName}</span>}</>
              ) : (
                <><AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500">Não configurado</span></>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-green-600" />
          Como funciona
        </p>
        <ol className="space-y-2 text-xs text-slate-600">
          <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold flex items-center justify-center shrink-0">1</span> Crie uma conta no Meta Developers e configure o WhatsApp Business API</li>
          <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold flex items-center justify-center shrink-0">2</span> Preencha o formulário abaixo com suas credenciais</li>
          <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold flex items-center justify-center shrink-0">3</span> Configure a URL do webhook no painel Meta usando o endereço exibido abaixo</li>
          <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold flex items-center justify-center shrink-0">4</span> Mensagens recebidas criarão conversas automaticamente no Inbox</li>
        </ol>
      </div>

      <WhatsappConfigForm integration={integration} webhookUrl={webhookUrl} />
    </div>
  )
}
