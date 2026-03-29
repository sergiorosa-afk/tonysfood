import { UnitFormClient } from '@/components/admin/unit-form-client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NovaUnidadePage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/unidades" className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nova Unidade</h1>
          <p className="text-sm text-slate-500">Adicione uma nova filial ao sistema</p>
        </div>
      </div>
      <UnitFormClient />
    </div>
  )
}
