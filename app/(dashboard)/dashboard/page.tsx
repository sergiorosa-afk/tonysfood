import { auth } from '@/lib/auth'
import { getDashboardStats, getUpcomingReservations, getCurrentQueue, getOpenConversations } from '@/lib/queries/dashboard'
import { StatsCard } from '@/components/dashboard/stats-card'
import { UpcomingReservations } from '@/components/dashboard/upcoming-reservations'
import { QueuePanel } from '@/components/dashboard/queue-panel'
import { ConversationsPanel } from '@/components/dashboard/conversations-panel'
import {
  CalendarDays,
  Users,
  MessageSquare,
  UserCheck,
  Clock,
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  const session = await auth()

  const [stats, upcomingReservations, currentQueue, openConversations] = await Promise.all([
    getDashboardStats(),
    getUpcomingReservations(),
    getCurrentQueue(),
    getOpenConversations(),
  ])

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {greeting}, {session?.user?.name?.split(' ')[0]}. Aqui está o resumo do dia.
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-slate-700">
            {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Atualizado agora</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Reservas Hoje"
          value={String(stats.reservationsToday)}
          icon={CalendarDays}
          description={`${stats.reservationsConfirmedToday} confirmadas`}
          color="green"
        />
        <StatsCard
          title="Na Fila Agora"
          value={String(stats.queueActive)}
          icon={Clock}
          description={`${stats.queueWaiting} aguardando · ${stats.queueCalled} chamados`}
          color="blue"
        />
        <StatsCard
          title="Conversas Abertas"
          value={String(stats.totalConversationsActive)}
          icon={MessageSquare}
          description={`${stats.pendingConversations} pendentes de resposta`}
          color="yellow"
        />
        <StatsCard
          title="Clientes Ativos"
          value={String(stats.totalCustomers)}
          icon={UserCheck}
          description={`${stats.vipCustomers} clientes VIP`}
          color="purple"
        />
      </div>

      {/* Main panels grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UpcomingReservations reservations={upcomingReservations as any} />
        <QueuePanel entries={currentQueue as any} />
      </div>

      {/* Conversations full width */}
      <ConversationsPanel conversations={openConversations as any} />
    </div>
  )
}
