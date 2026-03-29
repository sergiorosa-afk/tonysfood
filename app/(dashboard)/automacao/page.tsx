export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import {
  getAutomationRules, getMessageTemplates,
  getAutomationLogs, getAutomationStats,
} from '@/lib/queries/automations'
import { RuleCard } from '@/components/automations/rule-card'
import { TemplateCard } from '@/components/automations/template-card'
import { ExecutionLog } from '@/components/automations/execution-log'
import { Plus, Zap, FileText, Clock, CheckCircle, XCircle, Activity } from 'lucide-react'
import Link from 'next/link'

export default async function AutomacaoPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const session = await auth()
  const unitId = (session?.user as any)?.unitId
  const tab = searchParams.tab ?? 'rules'

  const [rules, templates, logs, stats] = await Promise.all([
    getAutomationRules(unitId),
    getMessageTemplates(unitId),
    getAutomationLogs(unitId, 50),
    getAutomationStats(unitId),
  ])

  const tabs = [
    { key: 'rules',     label: 'Regras',    icon: Zap,      count: rules.length },
    { key: 'templates', label: 'Templates', icon: FileText,  count: templates.length },
    { key: 'logs',      label: 'Logs',      icon: Clock,     count: logs.length },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Automações</h1>
          <p className="text-sm text-slate-500 mt-0.5">Regras automáticas de resposta e segmentação</p>
        </div>
        <div className="flex gap-2">
          {tab === 'templates' ? (
            <Link
              href="/automacao/templates/nova"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Novo Template
            </Link>
          ) : (
            <Link
              href="/automacao/nova"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nova Regra
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Regras ativas',    value: stats.activeRules,     icon: Zap,           color: 'bg-green-100 text-green-600' },
          { label: 'Templates ativos', value: stats.activeTemplates,  icon: FileText,       color: 'bg-purple-100 text-purple-600' },
          { label: 'Execuções',        value: stats.total,            icon: Activity,       color: 'bg-blue-100 text-blue-600' },
          { label: 'Sucesso',          value: stats.success,          icon: CheckCircle,    color: 'bg-emerald-100 text-emerald-600' },
          { label: 'Falhas',           value: stats.failed,           icon: XCircle,        color: 'bg-red-100 text-red-600' },
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
            href={`/automacao?tab=${t.key}`}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className={`text-[10px] ${tab === t.key ? 'text-slate-400' : 'text-slate-400'}`}>
              {t.count}
            </span>
          </Link>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'rules' && (
        <div>
          {rules.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <Zap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">Nenhuma regra criada</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Crie regras para automatizar mensagens, tags e segmentos</p>
              <Link
                href="/automacao/nova"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Criar primeira regra
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {rules.map((rule) => (
                <RuleCard key={rule.id} rule={rule} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'templates' && (
        <div>
          {templates.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">Nenhum template criado</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Templates são usados pelas regras para enviar mensagens</p>
              <Link
                href="/automacao/templates/nova"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Criar primeiro template
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {templates.map((t) => (
                <TemplateCard key={t.id} template={t} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'logs' && (
        <ExecutionLog logs={logs as any} />
      )}
    </div>
  )
}
