'use client'

import { useTransition, useState } from 'react'
import { UserCheck, UserX, Trash2, Loader2, XCircle } from 'lucide-react'
import { toggleUser, deleteUser } from '@/lib/actions/admin'

export function UserToggleDelete({
  userId, active, isSelf,
}: { userId: string; active: boolean; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [showDel, setShowDel] = useState(false)

  function handleToggle() {
    startTransition(async () => { await toggleUser(userId, !active) })
  }
  function handleDelete() {
    startTransition(async () => {
      await deleteUser(userId)
      setShowDel(false)
    })
  }

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        disabled={isPending || isSelf}
        title={active ? 'Desativar' : 'Ativar'}
        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors disabled:opacity-40"
      >
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5 text-green-600" />}
      </button>
      {!isSelf && (
        <button
          onClick={() => setShowDel(true)}
          disabled={isPending}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {showDel && (
        <div className="absolute right-0 top-8 z-10 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-red-700">Excluir usuário?</p>
          <div className="flex gap-1.5">
            <button onClick={handleDelete} disabled={isPending}
              className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold disabled:opacity-50">
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
              Excluir
            </button>
            <button onClick={() => setShowDel(false)} className="px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50">
              Não
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
