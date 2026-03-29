import { notFound } from 'next/navigation'
import { getUserById, getUnits } from '@/lib/queries/admin'
import { UserFormClient } from '@/components/admin/user-form-client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin', MANAGER: 'Gerente', HOST: 'Host',
  ATTENDANT: 'Atendente', MARKETING: 'Marketing', AUDITOR: 'Auditor',
}

export default async function EditUsuarioPage({ params }: { params: { id: string } }) {
  const [user, units] = await Promise.all([getUserById(params.id), getUnits()])
  if (!user) notFound()

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/usuarios" className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${user.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
            <p className="text-sm text-slate-500">{ROLE_LABELS[user.role]} · {user.email}</p>
          </div>
        </div>
      </div>
      <UserFormClient
        user={user}
        units={units.map((u) => ({ id: u.id, name: u.name }))}
      />
    </div>
  )
}
