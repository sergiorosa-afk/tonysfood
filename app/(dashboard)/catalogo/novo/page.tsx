import { CatalogItemForm } from '@/components/catalog/catalog-item-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getSegments } from '@/lib/queries/segments'

export const dynamic = 'force-dynamic'

export default async function NovoCatalogoPage() {
  const segments = await getSegments()

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/catalogo"
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Novo Item</h1>
          <p className="text-sm text-slate-500 mt-0.5">Adicione um item ao cardápio</p>
        </div>
      </div>

      <CatalogItemForm segments={segments} />
    </div>
  )
}
