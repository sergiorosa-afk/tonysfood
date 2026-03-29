import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCustomerById } from '@/lib/queries/customers'
import { updateCustomer } from '@/lib/actions/customers'
import { CustomerFormClient } from '@/components/customers/customer-form-client'
import { getSegments } from '@/lib/queries/segments'

export const dynamic = 'force-dynamic'

export default async function EditarClientePage({ params }: { params: { id: string } }) {
  const [customer, segments] = await Promise.all([
    getCustomerById(params.id),
    getSegments(),
  ])
  if (!customer) notFound()

  const action = updateCustomer.bind(null, customer.id)

  return (
    <div className="max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href={`/clientes/${customer.id}`}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {customer.name}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-800 font-medium">Editar</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Editar Cliente</h1>
        <p className="text-slate-500 mt-1 text-sm">Atualize os dados de {customer.name}</p>
      </div>

      <CustomerFormClient
        action={action}
        unitId={customer.unitId}
        segments={segments}
        defaultValues={{
          name:    customer.name,
          phone:   customer.phone ?? '',
          email:   customer.email ?? '',
          notes:   customer.notes ?? '',
          segment: customer.segment,
        }}
        submitLabel="Salvar Alterações"
      />
    </div>
  )
}
