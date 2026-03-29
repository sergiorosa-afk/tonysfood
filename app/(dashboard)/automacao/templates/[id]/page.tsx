import { notFound } from 'next/navigation'
import { getMessageTemplateById } from '@/lib/queries/automations'
import { TemplateFormClient } from '@/components/automations/template-form-client'
import { ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
  const template = await getMessageTemplateById(params.id)
  if (!template) notFound()

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/automacao?tab=templates"
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{template.name}</h1>
            <p className="text-sm text-slate-500">{template.category}</p>
          </div>
        </div>
      </div>

      <TemplateFormClient template={template} />
    </div>
  )
}
