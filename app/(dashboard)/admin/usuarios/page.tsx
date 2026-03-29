export const dynamic = 'force-dynamic'

import { getUsers } from '@/lib/queries/admin'
import { auth } from '@/lib/auth'
import { toggleUser, deleteUser } from '@/lib/actions/admin'
import { Plus, UserCheck, UserX, Pencil } from 'lucide-react'
import Link from 'next/link'
import { UserToggleDelete } from './user-toggle-delete'

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  ADMIN:      { label: 'Admin',       color: 'bg-red-100 text-red-700' },
  MANAGER:    { label: 'Gerente',     color: 'bg-purple-100 text-purple-700' },
  HOST:       { label: 'Host',        color: 'bg-blue-100 text-blue-700' },
  ATTENDANT:  { label: 'Atendente',   color: 'bg-green-100 text-green-700' },
  MARKETING:  { label: 'Marketing',   color: 'bg-yellow-100 text-yellow-700' },
  AUDITOR:    { label: 'Auditor',     color: 'bg-slate-100 text-slate-600' },
}

export default async function UsuariosPage() {
  const session = await auth()
  const currentUserId = (session?.user as any)?.id

  const users = await getUsers()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Usuários</h1>
          <p className="text-sm text-slate-500">{users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/admin/usuarios/novo"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Usuário</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Perfil</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Unidade</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => {
              const roleConfig = ROLE_LABELS[u.role] ?? { label: u.role, color: 'bg-slate-100 text-slate-600' }
              return (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${u.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${roleConfig.color}`}>
                      {roleConfig.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-slate-500">
                    {u.unit?.name ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {u.active
                      ? <span className="inline-flex items-center gap-1 text-xs text-green-600"><UserCheck className="w-3.5 h-3.5" />Ativo</span>
                      : <span className="inline-flex items-center gap-1 text-xs text-slate-400"><UserX className="w-3.5 h-3.5" />Inativo</span>
                    }
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/usuarios/${u.id}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                      <UserToggleDelete
                        userId={u.id}
                        active={u.active}
                        isSelf={u.id === currentUserId}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
