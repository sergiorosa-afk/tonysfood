'use client'


import { useFormState, useFormStatus } from 'react-dom'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import { createUser, updateUser } from '@/lib/actions/admin'

const ROLES = [
  { value: 'ADMIN',      label: 'Administrador',  desc: 'Acesso total ao sistema' },
  { value: 'MANAGER',    label: 'Gerente',         desc: 'Gestão operacional completa' },
  { value: 'HOST',       label: 'Host / Maître',   desc: 'Fila, reservas e atendimento' },
  { value: 'ATTENDANT',  label: 'Atendente',       desc: 'Inbox e fila' },
  { value: 'MARKETING',  label: 'Marketing',       desc: 'CRM e automações' },
  { value: 'AUDITOR',    label: 'Auditor',         desc: 'Somente leitura' },
]

type Unit = { id: string; name: string }
type User = {
  id: string
  name: string
  email: string
  role: string
  unitId: string | null
  active: boolean
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      {isEdit ? 'Salvar Alterações' : 'Criar Usuário'}
    </button>
  )
}

export function UserFormClient({ user, units }: { user?: User; units: Unit[] }) {
  const router = useRouter()
  const isEdit = !!user

  const action = isEdit
    ? updateUser.bind(null, user.id)
    : createUser

  const [state, formAction] = useFormState(action, null)

  useEffect(() => {
    if ((state as any)?.success) router.push('/admin/usuarios')
  }, [state, router])

  return (
    <form action={formAction} className="space-y-6">
      {(state as any)?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {(state as any).error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Dados Pessoais</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Nome completo *</label>
            <input
              name="name"
              defaultValue={user?.name}
              required
              placeholder="Ex: Maria Silva"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">E-mail *</label>
            <input
              name="email"
              type="email"
              defaultValue={user?.email}
              required
              placeholder="maria@tonysfood.com"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Senha {isEdit && <span className="font-normal text-slate-400">(deixe em branco para manter)</span>}
              {!isEdit && ' *'}
            </label>
            <input
              name="password"
              type="password"
              required={!isEdit}
              placeholder={isEdit ? '••••••••' : 'Mínimo 6 caracteres'}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Unidade</label>
            <select
              name="unitId"
              defaultValue={user?.unitId ?? ''}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">Todas as unidades</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Perfil de Acesso</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ROLES.map((r) => (
            <label key={r.value} className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-colors hover:border-green-300 ${
              user?.role === r.value ? 'border-green-500 bg-green-50' : 'border-slate-200'
            }`}>
              <input
                type="radio"
                name="role"
                value={r.value}
                defaultChecked={user?.role === r.value || (!user && r.value === 'ATTENDANT')}
                className="mt-0.5 text-green-600 focus:ring-green-400"
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">{r.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <SubmitButton isEdit={isEdit} />
      </div>
    </form>
  )
}
