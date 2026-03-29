'use client'

import { useState, useTransition } from 'react'
import { Star, StarOff, Eye, EyeOff, Pencil, Trash2, Loader2, Tag, AlertTriangle } from 'lucide-react'
import { toggleCatalogItem, toggleFeatured, deleteCatalogItem } from '@/lib/actions/catalog'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

const SEGMENT_BADGES: Record<string, { label: string; className: string }> = {
  VIP:      { label: 'VIP',     className: 'bg-amber-50 text-amber-600 border-amber-200' },
  REGULAR:  { label: 'Regular', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  NEW:      { label: 'Novo',    className: 'bg-green-50 text-green-600 border-green-200' },
  INACTIVE: { label: 'Inativo', className: 'bg-slate-50 text-slate-500 border-slate-200' },
}

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

export function CatalogItemCard({ item }: { item: CatalogItem }) {
  const [isPending, startTransition] = useTransition()
  const [showDelete, setShowDelete] = useState(false)

  const tags = (item.tags as string[]) || []
  const allergens = (item.allergens as string[]) || []
  const targetSegments = (item.targetSegments as string[]) || []

  function handleToggleActive() {
    startTransition(async () => { await toggleCatalogItem(item.id, !item.active) })
  }

  function handleToggleFeatured() {
    startTransition(async () => { await toggleFeatured(item.id, !item.featured) })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteCatalogItem(item.id)
      setShowDelete(false)
    })
  }

  return (
    <div className={`relative rounded-xl border bg-white shadow-sm overflow-hidden transition-all ${
      !item.active ? 'opacity-60' : ''
    }`}>
      {item.featured && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600" />
      )}

      {item.imageUrl ? (
        <div className="h-36 bg-slate-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-24 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <span className="text-3xl text-slate-300">🍽️</span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 truncate">{item.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{item.category}</p>
          </div>
          {item.price !== null && (
            <p className="text-sm font-bold text-green-700 shrink-0">{formatCurrency(item.price)}</p>
          )}
        </div>

        {item.description && (
          <p className="text-xs text-slate-500 mt-2 line-clamp-2">{item.description}</p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-green-50 text-green-700">
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {allergens.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {allergens.map((a) => (
              <span key={a} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-orange-50 text-orange-700">
                <AlertTriangle className="w-2.5 h-2.5" />
                {a}
              </span>
            ))}
          </div>
        )}

        {targetSegments.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {targetSegments.map((seg) => {
              const badge = SEGMENT_BADGES[seg]
              if (!badge) return null
              return (
                <span key={seg} className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badge.className}`}>
                  {badge.label}
                </span>
              )
            })}
          </div>
        )}

        <div className="flex items-center gap-1 mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={handleToggleFeatured}
            disabled={isPending}
            title={item.featured ? 'Remover destaque' : 'Destacar'}
            className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
              item.featured ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:bg-slate-100'
            }`}
          >
            {item.featured ? <Star className="w-3.5 h-3.5 fill-current" /> : <StarOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleToggleActive}
            disabled={isPending}
            title={item.active ? 'Desativar' : 'Ativar'}
            className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
              item.active ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-slate-400 hover:bg-slate-100'
            }`}
          >
            {item.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          <div className="flex-1" />

          <Link
            href={`/catalogo/${item.id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => setShowDelete(true)}
            disabled={isPending}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Excluir"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {showDelete && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
            <p className="text-xs font-semibold text-red-700">Excluir &quot;{item.name}&quot;?</p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Confirmar
              </button>
              <button
                onClick={() => setShowDelete(false)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
