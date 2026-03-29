import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createCustomer } from '@/lib/actions/customers'
import { prisma } from '@/lib/db'
import { CustomerFormClient } from '@/components/customers/customer-form-client'
import { getSegments } from '@/lib/queries/segments'

export default async function NovoClientePage() {
  const [unit, segments] = await Promise.all([
    prisma.unit.findFirst({ where: { active: true } }),
    getSegments(),
  ])

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/clientes"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Clientes
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-800 font-medium">Novo Cliente</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Novo Cliente</h1>
        <p className="text-slate-500 mt-1 text-sm">Cadastre um novo cliente no CRM</p>
      </div>

      <CustomerFormClient action={createCustomer} unitId={unit?.id ?? ''} segments={segments} />
    </div>
  )
}
