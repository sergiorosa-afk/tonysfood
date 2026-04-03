import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { BlockForm } from '@/components/blocks/block-form'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export default async function NovoBloqueioPage() {
  const session = await auth()
  const unitId  = (session?.user as any)?.unitId
  const unit    = await prisma.unit.findFirst({ where: { active: true } })
  const resolvedUnitId = unitId || unit?.id || ''

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/bloqueios"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Bloqueios
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-800 font-medium">Novo Bloqueio</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Novo Bloqueio de Reserva</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Defina quando as reservas não devem ser aceitas — a IA também será informada.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <BlockForm unitId={resolvedUnitId} />
      </div>
    </div>
  )
}
