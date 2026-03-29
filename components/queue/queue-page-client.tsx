'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { QueueAddForm } from './queue-add-form'

export function QueuePageClient({ unitId }: { unitId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors shadow-sm shadow-green-900/20"
      >
        <UserPlus className="w-4 h-4" />
        Adicionar à Fila
      </button>

      <QueueAddForm
        unitId={unitId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
