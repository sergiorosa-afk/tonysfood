export const dynamic = 'force-dynamic'

import { getSegments } from '@/lib/queries/segments'
import { SegmentList } from '@/components/admin/segment-list'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function SegmentosPage() {
  const segments = await getSegments()

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shadow-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Segmentos de Clientes</h1>
          <p className="text-sm text-slate-500 mt-0.5">Defina os segmentos disponíveis no sistema</p>
        </div>
      </div>
      <SegmentList segments={segments} />
    </div>
  )
}
