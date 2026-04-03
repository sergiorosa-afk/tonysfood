'use client'

import { useState, useTransition } from 'react'
import { Trash2, PowerOff, Power } from 'lucide-react'
import { deleteBlock, toggleBlock } from '@/lib/actions/blocks'

export function BlockActions({ id, active }: { id: string; active: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleToggle() {
    startTransition(() => toggleBlock(id, !active))
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    startTransition(() => deleteBlock(id))
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={handleToggle}
        disabled={isPending}
        title={active ? 'Desativar' : 'Ativar'}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
      >
        {active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4 text-green-600" />}
      </button>

      <button
        onClick={handleDelete}
        disabled={isPending}
        title={confirmDelete ? 'Clique novamente para confirmar' : 'Excluir'}
        className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
          confirmDelete
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'text-slate-400 hover:text-red-600 hover:bg-slate-100'
        }`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
