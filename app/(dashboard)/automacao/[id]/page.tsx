import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getAutomationRuleById, getMessageTemplates } from '@/lib/queries/automations'
import { RuleFormClient } from '@/components/automations/rule-form-client'
import { ExecutionLog } from '@/components/automations/execution-log'
import { getSegments } from '@/lib/queries/segments'
import { ArrowLeft, Zap } from 'lucide-react'
import Link from 'next/link'

export default async function EditRegraPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const unitId = (session?.user as any)?.unitId

  const [rule, templates, segments] = await Promise.all([
    getAutomationRuleById(params.id),
    getMessageTemplates(unitId),
    getSegments(),
  ])

  if (!rule) notFound()

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/automacao"
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            rule.active ? 'bg-green-100' : 'bg-slate-100'
          }`}>
            <Zap className={`w-5 h-5 ${rule.active ? 'text-green-600' : 'text-slate-400'}`} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{rule.name}</h1>
            <p className="text-sm text-slate-500">{rule.executionCount} execuções · {rule.logs.length} logs</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RuleFormClient rule={rule} templates={templates} segments={segments} />
        </div>

        {/* Recent logs sidebar */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Últimas execuções</h2>
          <ExecutionLog logs={rule.logs.map((l) => ({ ...l, rule: { id: rule.id, name: rule.name, triggerEvent: rule.triggerEvent } })) as any} />
        </div>
      </div>
    </div>
  )
}
