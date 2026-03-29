import { Session } from 'next-auth'
import { Sidebar } from './sidebar'
import { Header } from './header'

interface AppShellProps {
  session: Session
  children: React.ReactNode
}

export function AppShell({ session, children }: AppShellProps) {
  const user = session.user as any

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 15% 80%, rgba(255, 188, 111, 0.55), transparent 16%),
          radial-gradient(circle at 22% 55%, rgba(255, 213, 159, 0.28), transparent 12%),
          radial-gradient(circle at 30% 12%, rgba(255, 185, 115, 0.22), transparent 12%),
          radial-gradient(circle at 84% 10%, rgba(255, 213, 145, 0.18), transparent 11%),
          linear-gradient(180deg, rgba(19,23,42,0.83), rgba(32,20,20,0.40)),
          linear-gradient(120deg, #1b243e 0%, #2e2230 45%, #3d2a29 100%)
        `,
      }}
    >
      <Sidebar userName={user?.name} userRole={user?.role} />

      <div
        className="flex flex-col flex-1 min-w-0 overflow-hidden"
        style={{
          margin: '18px 18px 18px 0',
          borderRadius: 20,
          background: 'linear-gradient(180deg, rgba(246,247,251,.97), rgba(240,242,248,.95))',
          border: '1px solid rgba(255,255,255,0.40)',
          boxShadow: '0 20px 60px rgba(15, 22, 50, 0.14)',
          overflow: 'hidden',
        }}
      >
        <Header session={session} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
