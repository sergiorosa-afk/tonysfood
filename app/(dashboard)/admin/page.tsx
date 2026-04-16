export const dynamic = 'force-dynamic'

import { getAdminStats, getUsers, getUnits } from '@/lib/queries/admin'
import { getSegments } from '@/lib/queries/segments'
import { getSegmentColors } from '@/lib/segment-colors'
import {
  Users, Building2, UserCheck, Database,
  UtensilsCrossed, Bot, Webhook, Smartphone,
  ChevronRight, PlusCircle, Settings, Tags, CalendarOff,
} from 'lucide-react'
import Link from 'next/link'

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin', MANAGER: 'Gerente', HOST: 'Host',
  ATTENDANT: 'Atendente', MARKETING: 'Marketing', AUDITOR: 'Auditor',
}

export default async function AdminPage() {
  const [stats, users, units, segments] = await Promise.all([
    getAdminStats(),
    getUsers(),
    getUnits(),
    getSegments(),
  ])

  const setupSections = [
    {
      title: 'Cardápio / Catálogo',
      description: 'Gerencie itens, categorias e segmentos de ofertas',
      icon: UtensilsCrossed,
      href: '/catalogo',
      hrefNew: '/catalogo/novo',
      count: stats.catalogItems,
      countLabel: 'itens ativos',
      color: 'bg-green-100 text-green-600',
      accent: 'border-green-200 hover:border-green-400',
    },
    {
      title: 'Automações',
      description: 'Regras de disparo automático por evento e segmento',
      icon: Bot,
      href: '/automacao',
      hrefNew: null,
      count: stats.automations,
      countLabel: 'regras ativas',
      color: 'bg-purple-100 text-purple-600',
      accent: 'border-purple-200 hover:border-purple-400',
    },
    {
      title: 'WhatsApp Web',
      description: 'Conectar via QR Code para envio e recepção de mensagens',
      icon: Smartphone,
      href: '/integracoes/whatsapp-web',
      hrefNew: null,
      count: null,
      countLabel: null,
      color: 'bg-emerald-100 text-emerald-600',
      accent: 'border-emerald-200 hover:border-emerald-400',
    },
    {
      title: 'Webhooks',
      description: 'Integrações externas via HTTP para eventos do sistema',
      icon: Webhook,
      href: '/integracoes/webhooks',
      hrefNew: null,
      count: stats.webhooks,
      countLabel: 'endpoints ativos',
      color: 'bg-orange-100 text-orange-600',
      accent: 'border-orange-200 hover:border-orange-400',
    },
    {
      title: 'Usuários',
      description: 'Contas de acesso, roles e permissões por unidade',
      icon: Users,
      href: '/admin/usuarios',
      hrefNew: '/admin/usuarios/novo',
      count: stats.activeUsers,
      countLabel: 'usuários ativos',
      color: 'bg-blue-100 text-blue-600',
      accent: 'border-blue-200 hover:border-blue-400',
    },
    {
      title: 'Unidades',
      description: 'Restaurantes e filiais cadastrados no sistema',
      icon: Building2,
      href: '/admin/unidades',
      hrefNew: '/admin/unidades/nova',
      count: stats.units,
      countLabel: 'unidades',
      color: 'bg-indigo-100 text-indigo-600',
      accent: 'border-indigo-200 hover:border-indigo-400',
    },
    {
      title: 'Bloqueios de Reserva',
      description: 'Datas e horários em que reservas não são aceitas — a IA também é bloqueada',
      icon: CalendarOff,
      href: '/bloqueios',
      hrefNew: '/bloqueios/novo',
      count: null,
      countLabel: null,
      color: 'bg-red-100 text-red-600',
      accent: 'border-red-200 hover:border-red-400',
    },
    {
      title: 'Planta de Mesas',
      description: 'Cadastre e posicione as mesas do salão para controle de ocupação',
      icon: UtensilsCrossed,
      href: '/admin/planta',
      hrefNew: null,
      count: null,
      countLabel: null,
      color: 'bg-amber-100 text-amber-600',
      accent: 'border-amber-200 hover:border-amber-400',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Administração</h1>
        <p className="text-sm text-slate-500 mt-0.5">Configurações gerais, usuários e integrações do sistema</p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Usuários ativos', value: stats.activeUsers, icon: UserCheck,        color: 'bg-green-100 text-green-600' },
          { label: 'Unidades',        value: stats.units,       icon: Building2,        color: 'bg-indigo-100 text-indigo-600' },
          { label: 'Clientes total',  value: stats.customers,   icon: Database,         color: 'bg-orange-100 text-orange-600' },
          { label: 'Itens no cardápio', value: stats.catalogItems, icon: UtensilsCrossed, color: 'bg-green-100 text-green-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{value}</p>
                <p className="text-[11px] text-slate-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Setup / Configurações */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Configurações do Sistema</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {setupSections.map((sec) => {
            const Icon = sec.icon
            return (
              <div
                key={sec.title}
                className={`bg-white rounded-xl border shadow-sm p-5 transition-colors ${sec.accent}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${sec.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{sec.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{sec.description}</p>
                      {sec.count !== null && (
                        <p className="text-xs font-medium text-slate-400 mt-1.5">
                          <span className="text-slate-700 font-bold">{sec.count}</span> {sec.countLabel}
                        </p>
                      )}
                    </div>
                  </div>
                  {sec.hrefNew && (
                    <Link
                      href={sec.hrefNew}
                      title="Novo"
                      className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </Link>
                  )}
                </div>
                <Link
                  href={sec.href}
                  className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-600 transition-colors"
                >
                  Gerenciar
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* Segmentos de clientes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Segmentos de Clientes</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Segmentos disponíveis para classificar clientes e direcionar ofertas do catálogo
            </p>
          </div>
          <Link
            href="/admin/segmentos"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors"
          >
            <Tags className="w-3.5 h-3.5" />
            Gerenciar
          </Link>
        </div>
        <div className="flex flex-wrap gap-3">
          {segments.map((seg) => {
            const colors = getSegmentColors(seg.color)
            return (
              <div key={seg.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 min-w-[160px]">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colors.badge}`}>
                  {seg.label}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{seg.name}</span>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          O segmento é definido no cadastro do cliente e determina quais ofertas do catálogo ele recebe ao entrar na fila.
        </p>
      </div>

      {/* Users + Units */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Usuários</h2>
            <div className="flex items-center gap-3">
              <Link href="/admin/usuarios" className="text-xs text-slate-400 hover:text-slate-600">Ver todos</Link>
              <Link href="/admin/usuarios/novo" className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ Novo</Link>
            </div>
          </div>
          <div className="space-y-1">
            {users.slice(0, 8).map((u) => (
              <Link
                key={u.id}
                href={`/admin/usuarios/${u.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  u.active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                }`}>
                  {u.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${u.active ? 'text-slate-800' : 'text-slate-400'}`}>{u.name}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                  {!u.active && <span className="text-[10px] text-red-500">Inativo</span>}
                </div>
              </Link>
            ))}
            {users.length > 8 && (
              <Link href="/admin/usuarios" className="text-xs text-slate-400 hover:text-slate-600 block text-center pt-2">
                +{users.length - 8} usuários
              </Link>
            )}
          </div>
        </div>

        {/* Units */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Unidades</h2>
            <Link href="/admin/unidades/nova" className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ Nova</Link>
          </div>
          <div className="space-y-2">
            {units.map((u) => (
              <Link
                key={u.id}
                href={`/admin/unidades/${u.id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {u.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{u.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{u.slug}</p>
                </div>
                <div className="flex gap-3 text-xs text-slate-500 shrink-0">
                  <span>{u._count.users} user{u._count.users !== 1 ? 's' : ''}</span>
                  <span>{u._count.customers} cli.</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
