export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import {
  getIntegrations, getWebhooks,
  getWebhookLogs, getIntegrationStats,
} from '@/lib/queries/integrations'
import { WebhookCard } from '@/components/integrations/webhook-card'
import { WebhookLogList } from '@/components/integrations/webhook-log'
import {
  Plus, MessageCircle, Globe, Activity,
  CheckCircle, Settings, ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { getWaWebStateForUnit } from '@/lib/whatsapp-web/service'

const INTEGRATION_META = {
  whatsapp: {
    name: 'WhatsApp Business',
    icon: '💬',
    description: 'Receba e envie mensagens via WhatsApp Business API (Meta)',
    color: 'from-green-400 to-green-600',
  },
  whatsapp_web: {
    name: 'WhatsApp Web',
    icon: '📱',
    description: 'Conecte via QR Code sem API oficial — igual ao WhatsApp Web no navegador',
    color: 'from-emerald-400 to-teal-600',
    href: '/integracoes/whatsapp-web',
  },
  instagram: {
    name: 'Instagram DMs',
    icon: '📸',
    description: 'Integração com mensagens diretas do Instagram (em breve)',
    color: 'from-purple-400 to-pink-500',
    comingSoon: true,
  },
  ifood: {
    name: 'iFood',
    icon: '🛵',
    description: 'Sincronização com pedidos iFood (em breve)',
    color: 'from-red-400 to-red-600',
    comingSoon: true,
  },
} as const

export default async function IntegracoesPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const session = await auth()
  const unitId = (session?.user as any)?.unitId
  const tab = searchParams.tab ?? 'integrations'

  const [integrations, webhooks, logs, stats] = await Promise.all([
    getIntegrations(unitId),
    getWebhooks(unitId),
    getWebhookLogs(unitId, 30),
    getIntegrationStats(unitId),
  ])

  const intByType = Object.fromEntries(integrations.map((i) => [i.type, i]))

  // WhatsApp Web status comes from disk, not DB
  const waWebState = getWaWebStateForUnit(unitId)

  const tabs = [
    { key: 'integrations', label: 'Canais',   icon: MessageCircle },
    { key: 'webhooks',     label: 'Webhooks', icon: Globe },
    { key: 'logs',         label: 'Logs',     icon: Activity },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Integrações</h1>
          <p className="text-sm text-slate-500 mt-0.5">Conecte canais de comunicação e sistemas externos</p>
        </div>
        {tab === 'webhooks' && (
          <Link
            href="/integracoes/webhooks/nova"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Webhook
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Integrações ativas', value: stats.activeIntegrations, icon: MessageCircle, color: 'bg-green-100 text-green-600' },
          { label: 'Webhooks ativos',    value: stats.activeWebhooks,     icon: Globe,         color: 'bg-blue-100 text-blue-600' },
          { label: 'Total entregas',     value: stats.totalDeliveries,    icon: Activity,      color: 'bg-purple-100 text-purple-600' },
          { label: 'Sucesso',            value: stats.successDeliveries,  icon: CheckCircle,   color: 'bg-emerald-100 text-emerald-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{value}</p>
                <p className="text-[11px] text-slate-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/integracoes?tab=${t.key}`}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </Link>
        ))}
      </div>

      {/* ── Canais ── */}
      {tab === 'integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.entries(INTEGRATION_META).map(([type, meta]) => {
            const isComingSoon = (meta as any).comingSoon ?? false

            // WhatsApp Web: status from disk; others: from DB
            let isActive = false
            let statusLabel = 'Desconectado'
            let statusExtra: string | null = null

            if (type === 'whatsapp_web') {
              isActive = waWebState.status === 'connected'
              if (waWebState.status === 'connected') {
                statusLabel = 'Conectado'
                statusExtra = waWebState.phone ? `+${waWebState.phone}` : null
              } else if (waWebState.status === 'qr') {
                statusLabel = 'Aguardando QR'
              } else if (waWebState.status === 'connecting') {
                statusLabel = 'Conectando…'
              }
            } else {
              isActive = intByType[type]?.active ?? false
              statusLabel = isActive ? 'Conectado' : 'Desconectado'
            }

            return (
              <div key={type} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isComingSoon ? 'opacity-60' : ''}`}>
                {isActive && (
                  <div className={`h-1 bg-gradient-to-r ${meta.color}`} />
                )}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-2xl shrink-0`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900">{meta.name}</p>
                        {isComingSoon ? (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Em breve</span>
                        ) : isActive ? (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">Conectado</span>
                        ) : waWebState.status === 'qr' && type === 'whatsapp_web' ? (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Aguardando QR</span>
                        ) : waWebState.status === 'connecting' && type === 'whatsapp_web' ? (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Conectando…</span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Desconectado</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{meta.description}</p>
                      {statusExtra && (
                        <p className="text-xs text-green-600 font-medium mt-0.5">{statusExtra}</p>
                      )}
                    </div>
                  </div>

                  {!isComingSoon && (
                    <div className="mt-4">
                      <Link
                        href={(meta as any).href ?? `/integracoes/${type}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        {isActive ? 'Gerenciar' : 'Configurar'}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Webhooks ── */}
      {tab === 'webhooks' && (
        <div>
          {webhooks.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <Globe className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">Nenhum webhook configurado</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Webhooks enviam eventos do sistema para URLs externas em tempo real</p>
              <Link
                href="/integracoes/webhooks/nova"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Criar primeiro webhook
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {webhooks.map((wh) => (
                <WebhookCard key={wh.id} webhook={wh} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Logs ── */}
      {tab === 'logs' && (
        <WebhookLogList logs={logs as any} showWebhookName />
      )}
    </div>
  )
}
