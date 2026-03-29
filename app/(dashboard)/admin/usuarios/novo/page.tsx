import { getUnits } from '@/lib/queries/admin'
import { UserFormClient } from '@/components/admin/user-form-client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NovoUsuarioPage() {
  const units = await getUnits()

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/usuarios" className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Novo Usuário</h1>
          <p className="text-sm text-slate-500">Crie uma conta de acesso ao sistema</p>
        </div>
      </div>
      <UserFormClient units={units.map((u) => ({ id: u.id, name: u.name }))} />
    </div>
  )
}
