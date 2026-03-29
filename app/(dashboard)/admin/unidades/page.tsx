export const dynamic = 'force-dynamic'

import { getUnits } from '@/lib/queries/admin'
import { toggleUnit } from '@/lib/actions/admin'
import { Plus, Building2, Users, CalendarDays, Pencil } from 'lucide-react'
import Link from 'next/link'

export default async function UnidadesPage() {
  const units = await getUnits()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Unidades</h1>
          <p className="text-sm text-slate-500">{units.length} unidade{units.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/admin/unidades/nova"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Unidade
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {units.map((u) => (
          <div key={u.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${!u.active ? 'opacity-60' : ''}`}>
            {u.active && <div className="h-0.5 bg-gradient-to-r from-green-400 to-green-600" />}
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {u.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{u.name}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{u.slug}</p>
                  {u.address && <p className="text-xs text-slate-500 mt-1">{u.address}</p>}
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{u._count.users} usuários</span>
                <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{u._count.customers} clientes</span>
                <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{u._count.reservations} reservas</span>
                <Link href={`/admin/unidades/${u.id}`} className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
