'use client'

import { Session } from 'next-auth'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react'
import { getInitials, roleLabels } from '@/lib/utils'

interface HeaderProps {
  session: Session
}

export function Header({ session }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const user = session.user
  const userRole = (user as any).role as string
  const initials = user?.name ? getInitials(user.name) : 'U'

  return (
    <header
      className="flex items-center justify-between px-6 flex-shrink-0"
      style={{
        height: 60,
        borderBottom: '1px solid rgba(216, 222, 235, 0.7)',
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Left — date */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium" style={{ color: '#8a94b2' }}>
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Bell */}
        <button
          className="relative flex items-center justify-center rounded-xl transition-colors"
          style={{ width: 38, height: 38, color: '#8a94b2' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(31,43,99,0.07)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
        >
          <Bell style={{ width: 17, height: 17 }} />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 rounded-xl transition-colors"
            style={{ padding: '5px 10px 5px 5px' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(31,43,99,0.07)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center font-bold text-white"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f4d7be, #9a6341)',
                fontSize: '0.8rem',
                boxShadow: '0 4px 10px rgba(0,0,0,.15)',
              }}
            >
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="font-semibold leading-none" style={{ fontSize: '0.85rem', color: '#1d2640' }}>
                {user?.name?.split(' ')[0]}
              </p>
              <p className="mt-0.5" style={{ fontSize: '0.72rem', color: '#8a94b2' }}>
                {roleLabels[userRole] || userRole}
              </p>
            </div>
            <ChevronDown style={{ width: 14, height: 14, color: '#a0abc6' }} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-52 z-20 overflow-hidden"
                style={{
                  background: '#fff',
                  border: '1px solid #e4e9f4',
                  borderRadius: 14,
                  boxShadow: '0 16px 40px rgba(20, 30, 65, 0.14)',
                }}
              >
                <div className="px-4 py-3" style={{ borderBottom: '1px solid #f0f3fa' }}>
                  <p className="font-semibold truncate" style={{ fontSize: '0.875rem', color: '#1d2640' }}>
                    {user?.name}
                  </p>
                  <p className="truncate mt-0.5" style={{ fontSize: '0.75rem', color: '#8a94b2' }}>
                    {user?.email}
                  </p>
                </div>

                <div className="p-1.5">
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left" style={{ fontSize: '0.875rem', color: '#3d4a6b' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#f4f6fc')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
                  >
                    <User style={{ width: 16, height: 16, color: '#a0abc6' }} />
                    Meu Perfil
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left" style={{ fontSize: '0.875rem', color: '#3d4a6b' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#f4f6fc')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
                  >
                    <Settings style={{ width: 16, height: 16, color: '#a0abc6' }} />
                    Configurações
                  </button>
                </div>

                <div className="p-1.5" style={{ borderTop: '1px solid #f0f3fa' }}>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      signOut({ callbackUrl: '/login' })
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left"
                    style={{ fontSize: '0.875rem', color: '#cf5757' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(207,87,87,0.07)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
                  >
                    <LogOut style={{ width: 16, height: 16 }} />
                    Sair
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
