import { auth } from '@/lib/auth'
import { getMessageTemplates } from '@/lib/queries/automations'
import { RuleFormClient } from '@/components/automations/rule-form-client'
import { getSegments } from '@/lib/queries/segments'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NovaRegraPage() {
  const session = await auth()
  const unitId = (session?.user as any)?.unitId
  const [templates, segments] = await Promise.all([
    getMessageTemplates(unitId),
    getSegments(),
  ])

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/automacao"
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nova Regra</h1>
          <p className="text-sm text-slate-500 mt-0.5">Configure o gatilho, condições e ações</p>
        </div>
      </div>

      <RuleFormClient templates={templates} segments={segments} />
    </div>
  )
}
