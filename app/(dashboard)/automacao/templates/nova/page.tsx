import { TemplateFormClient } from '@/components/automations/template-form-client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NovoTemplatePage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/automacao?tab=templates"
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Novo Template</h1>
          <p className="text-sm text-slate-500 mt-0.5">Crie uma mensagem reutilizável com variáveis dinâmicas</p>
        </div>
      </div>

      <TemplateFormClient />
    </div>
  )
}
