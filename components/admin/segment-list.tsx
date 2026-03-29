'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createSegment, updateSegment, deleteSegment } from '@/lib/actions/segments'
import { getSegmentColors } from '@/lib/segment-colors'
import { useState, useTransition } from 'react'
import { Pencil, Trash2, Check, X, Loader2, Plus } from 'lucide-react'

type Segment = { id: string; name: string; label: string; color: string; order: number }

const COLORS = ['amber','blue','green','slate','purple','red','orange','pink','indigo','teal']

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-50">
      {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
      {label}
    </button>
  )
}

function CreateForm() {
  const [state, action] = useFormState(createSegment, null)
  return (
    <form action={action} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <h2 className="text-sm font-semibold text-slate-700">Novo Segmento</h2>
      {(state as { error?: string } | null)?.error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{(state as { error: string }).error}</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Nome (chave)</label>
          <input name="name" required placeholder="EX: PREMIUM" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" style={{ textTransform: 'uppercase' }} />
          <p className="text-[10px] text-slate-400">Maiúsculas, sem espaços</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Rótulo (exibição)</label>
          <input name="label" required placeholder="Ex: Premium" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Cor</label>
          <select name="color" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Ordem</label>
          <input name="order" type="number" defaultValue={0} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div className="flex justify-end">
        <SubmitBtn label="Criar Segmento" />
      </div>
    </form>
  )
}

function EditRow({ seg, onCancel }: { seg: Segment; onCancel: () => void }) {
  const action = updateSegment.bind(null, seg.id)
  const [state, formAction] = useFormState(action, null)
  return (
    <form action={formAction} className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-3">
      {(state as { error?: string } | null)?.error && (
        <p className="text-xs text-red-600">{(state as { error: string }).error}</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-medium text-slate-500">Nome</label>
          <input name="name" defaultValue={seg.name} required className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg" style={{ textTransform: 'uppercase' }} />
        </div>
        <div>
          <label className="text-[10px] font-medium text-slate-500">Rótulo</label>
          <input name="label" defaultValue={seg.label} required className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg" />
        </div>
        <div>
          <label className="text-[10px] font-medium text-slate-500">Cor</label>
          <select name="color" defaultValue={seg.color} className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white">
            {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-medium text-slate-500">Ordem</label>
          <input name="order" type="number" defaultValue={seg.order} className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-medium">
          <X className="w-3 h-3" /> Cancelar
        </button>
        <SubmitBtn label="Salvar" />
      </div>
    </form>
  )
}

export function SegmentList({ segments }: { segments: Segment[] }) {
  const [editing, setEditing] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function handleDelete(id: string) {
    setDeleteError(null)
    startTransition(async () => {
      const result = await deleteSegment(id)
      if ((result as { error?: string })?.error) setDeleteError((result as { error: string }).error)
    })
  }

  return (
    <div className="space-y-4">
      {/* Existing segments */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Segmentos cadastrados</h2>
        </div>
        {deleteError && (
          <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{deleteError}</div>
        )}
        <div className="divide-y divide-slate-100">
          {segments.map(seg => {
            const colors = getSegmentColors(seg.color)
            return (
              <div key={seg.id}>
                {editing === seg.id ? (
                  <div className="p-3">
                    <EditRow seg={seg} onCancel={() => setEditing(null)} />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-5 py-3">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${colors.badge}`}>
                      {seg.label}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{seg.name}</span>
                    <span className="text-[10px] text-slate-300 bg-slate-50 px-1.5 py-0.5 rounded">{seg.color}</span>
                    <span className="text-[10px] text-slate-300">ordem: {seg.order}</span>
                    <div className="flex-1" />
                    <button onClick={() => setEditing(seg.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(seg.id)} disabled={isPending} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          {segments.length === 0 && (
            <p className="px-5 py-8 text-sm text-slate-400 text-center">Nenhum segmento cadastrado</p>
          )}
        </div>
      </div>

      {/* Create form */}
      <CreateForm />
    </div>
  )
}
