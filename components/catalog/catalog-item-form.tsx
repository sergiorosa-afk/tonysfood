'use client'


import { useFormState, useFormStatus } from 'react-dom'
import { Loader2, Save } from 'lucide-react'
import { createCatalogItem, updateCatalogItem } from '@/lib/actions/catalog'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getSegmentColors } from '@/lib/segment-colors'

type CatalogItem = {
  id: string
  name: string
  category: string
  description: string | null
  price: number | null
  tags: unknown
  allergens: unknown
  targetSegments: unknown
  active: boolean
  featured: boolean
  imageUrl: string | null
}

const CATEGORIES = [
  'Entrada',
  'Prato Principal',
  'Massa',
  'Grelhados',
  'Frutos do Mar',
  'Salada',
  'Sobremesa',
  'Bebida',
  'Drink',
  'Outros',
]

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      {isEdit ? 'Salvar Alterações' : 'Criar Item'}
    </button>
  )
}

type SegmentOption = { name: string; label: string; color: string }

export function CatalogItemForm({ item, segments = [] }: { item?: CatalogItem; segments?: SegmentOption[] }) {
  const router = useRouter()
  const isEdit = !!item

  const action = isEdit
    ? updateCatalogItem.bind(null, item.id)
    : createCatalogItem

  const [state, formAction] = useFormState(action, null)

  useEffect(() => {
    if ((state as any)?.success) {
      router.push('/catalogo')
    }
  }, [state, router])

  const tags = ((item?.tags as string[]) || []).join(', ')
  const allergens = ((item?.allergens as string[]) || []).join(', ')
  const activeSegments = (item?.targetSegments as string[]) || []

  return (
    <form action={formAction} className="space-y-6">
      {(state as any)?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {(state as any).error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Informações do Item</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Nome *</label>
            <input
              name="name"
              defaultValue={item?.name}
              required
              placeholder="Ex: Filé Mignon ao Molho Madeira"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Categoria *</label>
            <select
              name="category"
              defaultValue={item?.category || ''}
              required
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">Selecione...</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Descrição</label>
            <textarea
              name="description"
              defaultValue={item?.description || ''}
              rows={3}
              placeholder="Descreva o prato, ingredientes principais..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Preço (R$)</label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={item?.price ?? ''}
              placeholder="0,00"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">URL da Imagem</label>
            <input
              name="imageUrl"
              type="url"
              defaultValue={item?.imageUrl || ''}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Tags e Alergênicos</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Tags</label>
            <input
              name="tags"
              defaultValue={tags}
              placeholder="vegetariano, sem glúten, picante"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-slate-400">Separe por vírgulas</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Alergênicos</label>
            <input
              name="allergens"
              defaultValue={allergens}
              placeholder="glúten, lactose, frutos do mar"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-slate-400">Separe por vírgulas</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Segmentos de Clientes</h2>
          <p className="text-xs text-slate-400 mt-1">
            Selecione quais segmentos recebem este item como oferta na fila. Deixe todos desmarcados para enviar a todos.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {segments.map((seg) => {
            const colors = getSegmentColors(seg.color)
            return (
              <label key={seg.name} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="targetSegments"
                  value={seg.name}
                  defaultChecked={activeSegments.includes(seg.name)}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${colors.badge}`}>
                  {seg.label}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Configurações</h2>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              name="featured"
              value="true"
              defaultChecked={item?.featured}
              className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
            />
            <span className="text-sm text-slate-700">Item em destaque</span>
          </label>
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
