import { notFound } from 'next/navigation'
import { getUnitById } from '@/lib/queries/admin'
import { UnitFormClient } from '@/components/admin/unit-form-client'
import { ArrowLeft, Building2 } from 'lucide-react'
import Link from 'next/link'

export default async function EditUnidadePage({ params }: { params: { id: string } }) {
  const unit = await getUnitById(params.id)
  if (!unit) notFound()

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/unidades" className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm">
            {unit.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{unit.name}</h1>
            <p className="text-sm text-slate-500 font-mono">{unit.slug}</p>
          </div>
        </div>
      </div>
      <UnitFormClient unit={unit} />
    </div>
  )
}
