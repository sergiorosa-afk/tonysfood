'use client'

import { useState, useTransition } from 'react'
import { FileText, Pencil, Trash2, Eye, EyeOff, Loader2, XCircle } from 'lucide-react'
import { toggleMessageTemplate, deleteMessageTemplate } from '@/lib/actions/automations'
import Link from 'next/link'

const CATEGORY_LABELS: Record<string, string> = {
  confirmation: 'Confirmação',
  reminder:     'Lembrete',
  welcome:      'Boas-vindas',
  queue:        'Fila',
  cancellation: 'Cancelamento',
  general:      'Geral',
}

type Template = {
  id: string
  name: string
  category: string
  body: string
  variables: unknown
  active: boolean
}

export function TemplateCard({ template }: { template: Template }) {
  const [isPending, startTransition] = useTransition()
  const [showDelete, setShowDelete] = useState(false)
  const variables = (template.variables as string[]) ?? []

  function handleToggle() {
    startTransition(async () => { await toggleMessageTemplate(template.id, !template.active) })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteMessageTemplate(template.id)
      setShowDelete(false)
    })
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
      !template.active ? 'opacity-60' : ''
    }`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-slate-900 text-sm">{template.name}</p>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 shrink-0">
                {CATEGORY_LABELS[template.category] ?? template.category}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-2 line-clamp-3 bg-slate-50 rounded-lg p-2 font-mono leading-relaxed">
              {template.body}
            </p>

            {variables.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {variables.map((v) => (
                  <span key={v} className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 font-mono">
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={handleToggle}
            disabled={isPending}
            title={template.active ? 'Desativar' : 'Ativar'}
            className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
              template.active ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-slate-400 hover:bg-slate-100'
            }`}
          >
            {template.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          <div className="flex-1" />

          <Link
            href={`/automacao/templates/${template.id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => setShowDelete(true)}
            disabled={isPending}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {showDelete && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
            <p className="text-xs font-semibold text-red-700">Excluir &quot;{template.name}&quot;?</p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                Excluir
              </button>
              <button onClick={() => setShowDelete(false)} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs hover:bg-slate-50">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
