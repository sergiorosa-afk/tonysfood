'use client'


import { useFormState, useFormStatus } from 'react-dom'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import { createUnit, updateUnit } from '@/lib/actions/admin'

type Unit = { id: string; name: string; slug: string; address: string | null; phone: string | null }

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      {isEdit ? 'Salvar Alterações' : 'Criar Unidade'}
    </button>
  )
}

export function UnitFormClient({ unit }: { unit?: Unit }) {
  const router = useRouter()
  const isEdit = !!unit

  const action = isEdit ? updateUnit.bind(null, unit.id) : createUnit
  const [state, formAction] = useFormState(action, null)

  useEffect(() => {
    if ((state as any)?.success) router.push('/admin/unidades')
  }, [state, router])

  return (
    <form action={formAction} className="space-y-6">
      {(state as any)?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {(state as any).error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Dados da Unidade</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Nome da unidade *</label>
            <input
              name="name"
              defaultValue={unit?.name}
              required
              placeholder="Ex: Tony's Food - Centro"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Slug (URL) *</label>
            <input
              name="slug"
              defaultValue={unit?.slug}
              required
              pattern="[a-z0-9-]+"
              placeholder="tonysfood-centro"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
            />
            <p className="text-xs text-slate-400">Apenas letras minúsculas, números e hífens</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Endereço</label>
            <input
              name="address"
              defaultValue={unit?.address ?? ''}
              placeholder="Rua Exemplo, 123 — Bairro"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Telefone</label>
            <input
              name="phone"
              defaultValue={unit?.phone ?? ''}
              placeholder="(11) 99999-9999"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <SubmitButton isEdit={isEdit} />
      </div>
    </form>
  )
}
