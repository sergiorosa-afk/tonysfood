'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  MessageSquare,
  UserCircle,
  BookOpen,
  Zap,
  Plug,
  ShieldCheck,
} from 'lucide-react'
import { cn, getInitials, roleLabels } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Reservas', href: '/reservas', icon: CalendarDays },
  { label: 'Fila', href: '/fila', icon: Users },
  { label: 'Inbox', href: '/inbox', icon: MessageSquare },
  { label: 'Clientes', href: '/clientes', icon: UserCircle },
  { label: 'Catálogo', href: '/catalogo', icon: BookOpen },
  { label: 'Automação', href: '/automacao', icon: Zap },
  { label: 'Integrações', href: '/integracoes', icon: Plug },
]

const adminItems = [
  { label: 'Admin', href: '/admin', icon: ShieldCheck },
]

interface SidebarProps {
  userName?: string | null
  userRole?: string | null
}

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname()
  const initials = userName ? getInitials(userName) : 'U'
  const roleLabel = userRole ? (roleLabels[userRole] || userRole) : 'Usuário'

  return (
    <aside
      className="w-[260px] flex-shrink-0 flex flex-col h-full"
      style={{
        background: 'linear-gradient(180deg, rgba(17, 26, 56, 0.97) 0%, rgba(11, 19, 48, 0.98) 100%)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3.5 px-5 py-6" style={{ paddingBottom: 28, marginBottom: 8 }}>
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            width: 46,
            height: 46,
            borderRadius: 16,
            background: 'linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.05))',
            border: '1px solid rgba(255,255,255,.12)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.12)',
            color: 'rgba(255,255,255,0.9)',
          }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
            <path d="M7 21c-.5-2-.8-4-.8-6.2 0-.8-.5-1.5-1.2-1.9A5.8 5.8 0 0 1 2 7.8C2 4.6 4.6 2 7.8 2c1.6 0 3 .6 4.1 1.7A5.8 5.8 0 0 1 16 2c3.2 0 5.8 2.6 5.8 5.8 0 2.1-1.1 4-2.8 5.1-.7.4-1.2 1.1-1.2 1.9 0 2.2-.3 4.3-.8 6.2" />
            <path d="M9.5 21h5" />
            <path d="M8 11c.5 1 1.5 2 4 2s3.5-1 4-2" />
          </svg>
        </div>
        <span
          className="text-white font-extrabold tracking-tight"
          style={{ fontSize: '1.95rem', letterSpacing: '-0.03em', lineHeight: 1 }}
        >
          Tony&apos;s Food
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto sidebar-nav px-4" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3.5 rounded-xl font-semibold transition-all duration-200',
                isActive
                  ? 'text-white'
                  : 'text-white/70 hover:text-white/95'
              )}
              style={{
                padding: '13px 14px',
                fontSize: '1.05rem',
                background: isActive
                  ? 'linear-gradient(90deg, #2474ff, #2e5fcd)'
                  : undefined,
                boxShadow: isActive ? '0 12px 24px rgba(41, 103, 255, 0.25)' : undefined,
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = ''
              }}
            >
              <Icon
                className="flex-shrink-0"
                style={{ width: 20, height: 20, opacity: isActive ? 1 : 0.75 }}
              />
              <span>{item.label}</span>
            </Link>
          )
        })}

        {/* Admin section */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p
            className="font-semibold uppercase"
            style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', paddingLeft: 14, marginBottom: 6 }}
          >
            Sistema
          </p>
          {adminItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3.5 rounded-xl font-semibold transition-all duration-200',
                  isActive ? 'text-white' : 'text-white/70 hover:text-white/95'
                )}
                style={{
                  padding: '13px 14px',
                  fontSize: '1.05rem',
                  background: isActive ? 'linear-gradient(90deg, #2474ff, #2e5fcd)' : undefined,
                  boxShadow: isActive ? '0 12px 24px rgba(41, 103, 255, 0.25)' : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = ''
                }}
              >
                <Icon className="flex-shrink-0" style={{ width: 20, height: 20, opacity: isActive ? 1 : 0.75 }} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer — user card + version */}
      <div style={{ padding: '18px 16px 20px', borderTop: '1px solid rgba(255,255,255,0.09)', display: 'grid', gap: 14 }}>
        {userName && (
          <div
            className="flex items-center gap-3.5"
            style={{
              padding: '12px 10px',
              borderRadius: 16,
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center font-bold text-white"
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f4d7be, #9a6341)',
                border: '2px solid rgba(255,255,255,.18)',
                boxShadow: '0 6px 14px rgba(0,0,0,.18)',
                fontSize: '0.95rem',
              }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <strong className="block text-white truncate" style={{ fontSize: '1rem', lineHeight: 1.2, fontWeight: 600 }}>
                {userName}
              </strong>
              <span className="block truncate" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.62)', marginTop: 2 }}>
                {roleLabel}
              </span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between px-1">
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>v1.0.0 — Sprint 12</span>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded font-semibold"
            style={{ fontSize: '0.65rem', background: 'rgba(46, 108, 255, 0.2)', color: '#7aabff', border: '1px solid rgba(46, 108, 255, 0.3)' }}
          >
            BETA
          </span>
        </div>
      </div>
    </aside>
  )
}
