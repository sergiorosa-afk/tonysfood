export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PlantaEditor } from '@/components/mesas/planta-editor'
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

  const livres       = mesas.filter((m) => m.status === 'LIVRE').length
  const ocupadas     = mesas.filter((m) => m.status === 'OCUPADA').length
  const capacidade   = mesas.reduce((s, m) => s + m.capacidade, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Planta de Mesas</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Editor visual do salão — arraste para reposicionar, clique para editar
          </p>
        </div>
        {unit && mesas.length === 0 && <SeedMesasButton unitId={unit.id} />}
      </div>

      {/* KPIs */}
      {mesas.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total de Mesas',   value: mesas.length, icon: Grid3X3,         color: 'text-slate-600', bg: 'bg-slate-100' },
            { label: 'Livres',           value: livres,       icon: UtensilsCrossed,  color: 'text-green-600', bg: 'bg-green-50'  },
            { label: 'Ocupadas',         value: ocupadas,     icon: UtensilsCrossed,  color: 'text-red-500',   bg: 'bg-red-50'    },
            { label: 'Lugares no Salão', value: capacidade,   icon: Users,            color: 'text-blue-600',  bg: 'bg-blue-50'   },
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

      {/* Editor ou estado vazio */}
      {mesas.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Grid3X3 className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">Nenhuma mesa cadastrada</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Crie um layout inicial com mesas de exemplo ou adicione manualmente pelo editor.
          </p>
          {unit && <SeedMesasButton unitId={unit.id} />}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <PlantaEditor
            initialMesas={mesas.map((m) => ({
              id:         m.id,
              numero:     m.numero,
              capacidade: m.capacidade,
              forma:      m.forma,
              status:     m.status,
              posX:       m.posX,
              posY:       m.posY,
              largura:    m.largura,
              altura:     m.altura,
            }))}
            unitId={unit!.id}
          />
        </div>
      )}
    </div>
  )
}
