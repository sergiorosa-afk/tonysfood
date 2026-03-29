import { auth } from '@/lib/auth'
import { ShieldAlert, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const role = (session?.user as any)?.role

  if (role !== 'ADMIN' && role !== 'MANAGER') {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Acesso Negado</h2>
          <p className="text-sm text-slate-500 mb-6">
            Você não tem permissão para acessar a área de administração.
            Esta área é restrita a perfis <strong>Admin</strong> e <strong>Gerente</strong>.
          </p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors">
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const isAdmin = role === 'ADMIN'

  return (
    <div className="space-y-6">
      {/* Admin sub-nav */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <Link href="/admin" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 transition-colors">
          Visão Geral
        </Link>
        <Link href="/admin/usuarios" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 transition-colors">
          Usuários
        </Link>
        {isAdmin && (
          <Link href="/admin/unidades" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 transition-colors">
            Unidades
          </Link>
        )}
        <Link href="/admin/relatorios" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 transition-colors flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5" />
          Relatórios
        </Link>
      </div>
      {children}
    </div>
  )
}
