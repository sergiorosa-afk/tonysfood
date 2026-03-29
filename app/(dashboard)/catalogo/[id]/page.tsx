import { getCatalogItemById } from '@/lib/queries/catalog'
import { CatalogItemForm } from '@/components/catalog/catalog-item-form'
import { ArrowLeft, Package } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSegments } from '@/lib/queries/segments'

export const dynamic = 'force-dynamic'

export default async function EditCatalogoPage({ params }: { params: { id: string } }) {
  const [item, segments] = await Promise.all([
    getCatalogItemById(params.id),
    getSegments(),
  ])
  if (!item) notFound()

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/catalogo"
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{item.name}</h1>
            <p className="text-sm text-slate-500">{item.category}</p>
          </div>
        </div>
      </div>

      <CatalogItemForm item={item} segments={segments} />
    </div>
  )
}
