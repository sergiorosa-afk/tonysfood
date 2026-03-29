import Link from 'next/link'
import { UserPlus, Users, Star, Sparkles, UserMinus } from 'lucide-react'
import { getCustomers, getCustomerStats } from '@/lib/queries/customers'
import { CustomerSegmentBadge } from '@/components/customers/customer-segment-badge'
import { getInitials } from '@/lib/utils'
import { prisma } from '@/lib/db'
import { getSegments } from '@/lib/queries/segments'

export const dynamic = 'force-dynamic'

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { segment?: string; q?: string }
}) {
  const segment = searchParams.segment || 'all'
  const q = searchParams.q || ''

  const unit = await prisma.unit.findFirst({ where: { active: true } })

  const [customers, stats, dbSegments] = await Promise.all([
    getCustomers({ segment, q, unitId: unit?.id }),
    getCustomerStats(unit?.id),
    getSegments(),
  ])

  const segmentOptions = [
    { value: 'all', label: 'Todos' },
    ...dbSegments.map((seg) => ({ value: seg.name, label: seg.label })),
  ]

  const segmentMap = Object.fromEntries(dbSegments.map((seg) => [seg.name, seg]))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500 mt-1 text-sm">CRM e gestão de relacionamento</p>
        </div>
        <Link
          href="/clientes/novo"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Novo Cliente
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',    value: stats.total,        Icon: Users,     color: 'text-slate-700',  bg: 'bg-slate-100' },
          { label: 'VIP',      value: stats.vip,          Icon: Star,      color: 'text-amber-600',  bg: 'bg-amber-50' },
          { label: 'Novos',    value: stats.newCustomers, Icon: Sparkles,  color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Inativos', value: stats.inactive,     Icon: UserMinus, color: 'text-slate-500',  bg: 'bg-slate-100' },
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

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3">
        {/* Segment tabs */}
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {segmentOptions.map((opt) => (
            <a
              key={opt.value}
              href={`/clientes?segment=${opt.value}&q=${q}`}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                segment === opt.value ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </a>
          ))}
        </div>

        {/* Search */}
        <form method="GET" action="/clientes" className="flex gap-2 flex-1 min-w-48">
          <input type="hidden" name="segment" value={segment} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome, telefone ou e-mail..."
            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Customer list */}
      {customers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">Nenhum cliente encontrado</p>
          <p className="text-xs text-slate-400 mt-1">Tente ajustar os filtros ou cadastre um novo cliente</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Contato</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Tags</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Visitas</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Última visita</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Segmento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {customers.map((customer) => {
                const initials = getInitials(customer.name)
                const segmentColor = {
                  VIP:      'from-amber-400 to-amber-600',
                  REGULAR:  'from-blue-400 to-blue-600',
                  NEW:      'from-green-400 to-green-600',
                  INACTIVE: 'from-slate-300 to-slate-400',
                }[customer.segment] ?? 'from-slate-400 to-slate-600'

                return (
                  <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/clientes/${customer.id}`} className="flex items-center gap-3 group">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${segmentColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 group-hover:text-green-700 transition-colors">
                            {customer.name}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {customer._count.reservations} reservas · {customer._count.conversations} conversas
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <p className="text-xs text-slate-700">{customer.phone ?? '—'}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[160px]">{customer.email ?? ''}</p>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {customer.tags.slice(0, 3).map(t => (
                          <span key={t.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            {t.tag}
                          </span>
                        ))}
                        {customer.tags.length > 3 && (
                          <span className="text-[10px] text-slate-400">+{customer.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-slate-900">{customer.visitCount}</p>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <p className="text-xs text-slate-600">
                        {customer.lastVisitAt
                          ? new Date(customer.lastVisitAt).toLocaleDateString('pt-BR')
                          : '—'}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <CustomerSegmentBadge
                      segment={customer.segment}
                      label={segmentMap[customer.segment]?.label}
                      color={segmentMap[customer.segment]?.color}
                      size="xs"
                    />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-500">
              {customers.length} cliente{customers.length !== 1 ? 's' : ''} encontrado{customers.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
