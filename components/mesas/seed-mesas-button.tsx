'use client'

import { useState, useTransition } from 'react'
import { Loader2, Wand2 } from 'lucide-react'
import { seedMesas } from '@/lib/actions/mesas'
import { useRouter } from 'next/navigation'

export function SeedMesasButton({ unitId }: { unitId: string }) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const router = useRouter()

  function handleSeed() {
    startTransition(async () => {
      const result = await seedMesas(unitId)
      setMessage(result.message ?? '')
      if (result.success) router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleSeed}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
        Criar mesas de exemplo
      </button>
      {message && (
        <p className={`text-xs ${message.includes('sucesso') ? 'text-green-600' : 'text-red-500'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
