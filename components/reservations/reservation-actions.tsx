'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, XCircle, LogIn, AlertTriangle, Loader2 } from 'lucide-react'
import { confirmReservation, cancelReservation, checkInReservation, markNoShow } from '@/lib/actions/reservations'

interface ReservationActionsProps {
  id: string
  status: string
  compact?: boolean
}

export function ReservationActions({ id, status, compact = false }: ReservationActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [activeAction, setActiveAction] = useState<string | null>(null)

  function handleAction(action: string, fn: () => Promise<void>) {
    setActiveAction(action)
    startTransition(async () => {
      try {
        await fn()
      } catch (e) {
        console.error(e)
      } finally {
        setActiveAction(null)
      }
    })
  }

  const loading = (key: string) => isPending && activeAction === key

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {status === 'PENDING' && (
          <button
            onClick={() => handleAction('confirm', () => confirmReservation(id))}
            disabled={isPending}
            title="Confirmar"
            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            {loading('confirm') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
          </button>
        )}
        {(status === 'PENDING' || status === 'CONFIRMED') && (
          <button
            onClick={() => handleAction('checkin', () => checkInReservation(id))}
            disabled={isPending}
            title="Check-in"
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {loading('checkin') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
          </button>
        )}
        {(status === 'PENDING' || status === 'CONFIRMED') && (
          <button
            onClick={() => handleAction('cancel', () => cancelReservation(id))}
            disabled={isPending}
            title="Cancelar"
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {loading('cancel') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'PENDING' && (
        <button
          onClick={() => handleAction('confirm', () => confirmReservation(id))}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading('confirm') ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Confirmar
        </button>
      )}

      {(status === 'PENDING' || status === 'CONFIRMED') && (
        <button
          onClick={() => handleAction('checkin', () => checkInReservation(id))}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading('checkin') ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          Check-in
        </button>
      )}

      {(status === 'PENDING' || status === 'CONFIRMED') && (
        <button
          onClick={() => handleAction('noshow', () => markNoShow(id))}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading('noshow') ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
          No-show
        </button>
      )}

      {(status === 'PENDING' || status === 'CONFIRMED') && (
        <button
          onClick={() => handleAction('cancel', () => cancelReservation(id))}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading('cancel') ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
          Cancelar
        </button>
      )}
    </div>
  )
}
