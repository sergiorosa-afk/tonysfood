export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { getCatalogItems, getCatalogCategories, getCatalogStats } from '@/lib/queries/catalog'
import { CatalogItemCard } from '@/components/catalog/catalog-item-card'
import { Plus, Package, Eye, Star, Tag } from 'lucide-react'
import Link from 'next/link'

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: { category?: string; tag?: string; active?: string; q?: string }
}) {
  const session = await auth()
  const unitId = (session?.user as any)?.unitId

  const [stats, categories, items] = await Promise.all([
    getCatalogStats(unitId),
    getCatalogCategories(unitId),
    getCatalogItems({
      unitId,
      category: searchParams.category,
      tag: searchParams.tag,
      active: searchParams.active === 'inactive' ? false : searchParams.active === 'active' ? true : undefined,
      q: searchParams.q,
    }),
  ])

  // Group items by category
  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cardápio</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gerencie itens, categorias e destaques</p>
        </div>
        <Link
          href="/catalogo/novo"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Item
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
              <p className="text-xs text-slate-500">Ativos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.featured}</p>
              <p className="text-xs text-slate-500">Destaques</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.categories.length}</p>
              <p className="text-xs text-slate-500">Categorias</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <form className="flex flex-wrap gap-3">
          <input
            name="q"
            defaultValue={searchParams.q}
            placeholder="Buscar item..."
            className="flex-1 min-w-40 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <select
            name="category"
            defaultValue={searchParams.category || 'all'}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="all">Todas categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            name="active"
            defaultValue={searchParams.active || 'all'}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
          >
            Filtrar
          </button>

          {(searchParams.q || (searchParams.category && searchParams.category !== 'all') || (searchParams.active && searchParams.active !== 'all')) && (
            <Link
              href="/catalogo"
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition-colors"
            >
              Limpar
            </Link>
          )}
        </form>
      </div>

      {/* Category stats bar */}
      {stats.categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stats.categories.map((cat) => (
            <Link
              key={cat.category}
              href={`/catalogo?category=${encodeURIComponent(cat.category)}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                searchParams.category === cat.category
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-green-400 hover:text-green-700'
              }`}
            >
              {cat.category}
              <span className={`text-[10px] ${searchParams.category === cat.category ? 'text-green-200' : 'text-slate-400'}`}>
                {cat._count.id}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Items grid grouped by category */}
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">Nenhum item encontrado</p>
          <p className="text-xs text-slate-400 mt-1">Ajuste os filtros ou adicione novos itens</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, catItems]) => (
            <div key={category}>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                {category}
                <span className="text-xs font-normal text-slate-400 normal-case">({catItems.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {catItems.map((item) => (
                  <CatalogItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
