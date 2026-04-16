export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PlantaMesas } from '@/components/mesas/planta-mesas'
import { UtensilsCrossed, CheckCircle, XCircle, Users } from 'lucide-react'
import Link from 'next/link'

export default async function MesasPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const unit = await prisma.unit.findFirst({ where: { active: true } })

  if (!unit) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Nenhuma unidade ativa encontrada.
      </div>
    )
  }

  const mesas = await prisma.mesa.findMany({
    where: { unitId: unit.id, ativo: true },
    orderBy: [{ posY: 'asc' }, { posX: 'asc' }, { numero: 'asc' }],
    include: {
      queueEntries: {
        where: { status: { in: ['CALLED', 'SEATED'] } },
        select: {
          id: true,
          guestName: true,
          partySize: true,
          status: true,
          calledAt: true,
        },
        take: 1,
        orderBy: { calledAt: 'desc' },
      },
    },
  })

  const grupos = await prisma.mesaGrupo.findMany({
    where: { unitId: unit.id, status: 'ATIVO' },
    include: {
      mesas: { select: { mesaId: true } },
      queueEntries: {
        where: { status: { in: ['CALLED', 'SEATED'] } },
        select: { id: true, guestName: true, partySize: true, status: true },
        take: 1,
      },
    },
  })

  const total    = mesas.length
  const livres   = mesas.filter((m) => m.status === 'LIVRE').length
  const ocupadas = mesas.filter((m) => m.status === 'OCUPADA').length
  const lugares  = mesas.reduce((s, m) => s + m.capacidade, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mesas</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Situação em tempo real do salão · atualização automática a cada 30s
          </p>
        </div>
        <Link
          href="/admin/planta"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <UtensilsCrossed className="w-4 h-4" />
          Editar planta
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',   value: total,    Icon: UtensilsCrossed, color: 'text-slate-600', bg: 'bg-slate-100' },
          { label: 'Livres',  value: livres,   Icon: CheckCircle,     color: 'text-green-600', bg: 'bg-green-50'  },
          { label: 'Ocupadas',value: ocupadas, Icon: XCircle,         color: 'text-red-500',   bg: 'bg-red-50'    },
          { label: 'Lugares', value: lugares,  Icon: Users,           color: 'text-blue-600',  bg: 'bg-blue-50'   },
        ].map(({ label, value, Icon, color, bg }) => (
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

      {/* Planta */}
      {mesas.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <UtensilsCrossed className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">Nenhuma mesa cadastrada</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Configure o salão primeiro na planta de mesas.
          </p>
          <Link
            href="/admin/planta"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 transition-colors"
          >
            <UtensilsCrossed className="w-4 h-4" />
            Ir para a planta
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <PlantaMesas
            unitId={unit.id}
            mesas={mesas.map((m) => ({
              id:          m.id,
              numero:      m.numero,
              capacidade:  m.capacidade,
              forma:       m.forma,
              status:      m.status,
              posX:        m.posX,
              posY:        m.posY,
              largura:     m.largura,
              altura:      m.altura,
              queueEntries: m.queueEntries.map((e) => ({
                id:        e.id,
                guestName: e.guestName,
                partySize: e.partySize,
                status:    e.status,
                calledAt:  e.calledAt?.toISOString() ?? null,
              })),
            }))}
            grupos={grupos.map((g) => ({
              id:          g.id,
              capacidade:  g.capacidade,
              mesas:       g.mesas,
              queueEntries: g.queueEntries,
            }))}
          />
        </div>
      )}
    </div>
  )
}
