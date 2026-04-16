export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SeedMesasButton } from '@/components/mesas/seed-mesas-button'
import { UtensilsCrossed, Grid3X3, Users } from 'lucide-react'

export default async function PlantaAdminPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const unit = await prisma.unit.findFirst({ where: { active: true } })
  const mesas = unit
    ? await prisma.mesa.findMany({
        where: { unitId: unit.id, ativo: true },
        orderBy: [{ posY: 'asc' }, { posX: 'asc' }, { numero: 'asc' }],
      })
    : []

  const livres  = mesas.filter((m) => m.status === 'LIVRE').length
  const ocupadas = mesas.filter((m) => m.status === 'OCUPADA').length
  const capacidadeTotal = mesas.reduce((sum, m) => sum + m.capacidade, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Planta de Mesas</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gerencie o layout do salão — Sprint 2 trará o editor visual drag & drop
          </p>
        </div>
        {unit && mesas.length === 0 && (
          <SeedMesasButton unitId={unit.id} />
        )}
      </div>

      {/* KPIs */}
      {mesas.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total de Mesas',    value: mesas.length,    icon: Grid3X3,        color: 'text-slate-600',  bg: 'bg-slate-100' },
            { label: 'Livres',            value: livres,          icon: UtensilsCrossed, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Ocupadas',          value: ocupadas,        icon: UtensilsCrossed, color: 'text-red-500',   bg: 'bg-red-50' },
            { label: 'Lugares no Salão',  value: capacidadeTotal, icon: Users,           color: 'text-blue-600',  bg: 'bg-blue-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lista de mesas */}
      {mesas.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Grid3X3 className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">Nenhuma mesa cadastrada</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Clique em &quot;Criar mesas de exemplo&quot; para popular com um layout inicial, ou aguarde o editor visual no Sprint 2.
          </p>
          {unit && <SeedMesasButton unitId={unit.id} />}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">{mesas.length} mesas cadastradas</p>
            <span className="text-xs text-slate-400">Editor drag & drop disponível no Sprint 2</span>
          </div>
          <div className="divide-y divide-slate-50">
            {mesas.map((mesa) => (
              <div key={mesa.id} className="px-4 py-3 flex items-center gap-4">
                {/* Número */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  mesa.status === 'LIVRE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {mesa.numero}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">Mesa {mesa.numero}</p>
                  <p className="text-xs text-slate-400">
                    {mesa.capacidade} lugares · {mesa.forma} · posição ({mesa.posX}, {mesa.posY}) · {mesa.largura}×{mesa.altura} cel
                  </p>
                </div>

                {/* Status badge */}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  mesa.status === 'LIVRE'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {mesa.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
