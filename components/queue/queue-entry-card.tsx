'use client'

import { useState, useTransition } from 'react'
import { Users, Clock, Phone, MessageCircle, UserCheck, Loader2, ArrowRight, XCircle } from 'lucide-react'
import { callGuest, seatGuest, abandonQueue, transferGuest } from '@/lib/actions/queue'
import { QueueStatusBadge } from './queue-status-badge'

const channelIcon = {
  IN_PERSON: null,
  WHATSAPP:  MessageCircle,
  PHONE:     Phone,
  APP:       null,
}

const abandonReasons = [
  'Tempo de espera longo',
  'Mudança de planos',
  'Encontrou outro lugar',
  'Desistiu sem informar motivo',
  'Outro',
]

type QueueEntry = {
  id: string
  guestName: string
  guestPhone: string | null
  partySize: number
  position: number
  status: string
  channel: string
  estimatedWait: number | null
  createdAt: Date
  calledAt: Date | null
  notes: string | null
  customer: { name: string; segment: string } | null
}

export function QueueEntryCard({ entry }: { entry: QueueEntry }) {
  const [isPending, startTransition] = useTransition()
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [showAbandon, setShowAbandon] = useState(false)
  const [abandonReason, setAbandonReason] = useState('')

  const waitMinutes = Math.floor((Date.now() - new Date(entry.createdAt).getTime()) / 60000)
  const isVip = entry.customer?.segment === 'VIP'
  const isWaiting = entry.status === 'WAITING'
  const isCalled = entry.status === 'CALLED'
  const ChanIcon = channelIcon[entry.channel as keyof typeof channelIcon]

  function run(key: string, fn: () => Promise<void>) {
    setActiveAction(key)
    startTransition(async () => {
      try { await fn() } finally { setActiveAction(null) }
    })
  }

  const loading = (key: string) => isPending && activeAction === key

  const cardBorder = isCalled
    ? 'border-blue-200 bg-blue-50/30 shadow-blue-100'
    : isWaiting
    ? 'border-slate-200 bg-white'
    : 'border-slate-200 bg-slate-50'

  return (
    <div className={`relative rounded-xl border ${cardBorder} shadow-sm overflow-hidden transition-all`}>
      {/* Called indicator */}
      {isCalled && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
      )}

      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Position number */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xl ${
            isCalled
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
              : isWaiting
              ? 'bg-slate-100 text-slate-700'
              : 'bg-slate-200 text-slate-500'
          }`}>
            {isWaiting ? entry.position : isCalled ? '!' : '✓'}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-base font-bold text-slate-900 truncate">{entry.guestName}</p>
              {isVip && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">VIP</span>
              )}
              <QueueStatusBadge status={entry.status} size="xs" />
            </div>

            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-sm text-slate-600 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                {entry.partySize} {entry.partySize === 1 ? 'pessoa' : 'pessoas'}
              </span>
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {waitMinutes < 1 ? 'agora mesmo' : `${waitMinutes} min aguardando`}
              </span>
              {entry.estimatedWait && isWaiting && (
                <span className="text-sm font-medium text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">
                  ~{entry.estimatedWait} min ETA
                </span>
              )}
              {ChanIcon && (
                <span className="text-slate-400">
                  <ChanIcon className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            {entry.guestPhone && (
              <p className="text-xs text-slate-400 mt-1">{entry.guestPhone}</p>
            )}
            {entry.notes && (
              <p className="text-xs text-slate-500 mt-1 italic">&quot;{entry.notes}&quot;</p>
            )}
          </div>
        </div>

        {/* Actions */}
        {(isWaiting || isCalled) && !showAbandon && (
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {isWaiting && (
              <button
                onClick={() => run('call', () => callGuest(entry.id))}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {loading('call') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                Chamar
              </button>
            )}

            {isCalled && (
              <button
                onClick={() => run('seat', () => seatGuest(entry.id))}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {loading('seat') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                Sentar
              </button>
            )}

            {isCalled && (
              <button
                onClick={() => run('transfer', () => transferGuest(entry.id))}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors disabled:opacity-50"
              >
                {loading('transfer') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                Transferir
              </button>
            )}

            <button
              onClick={() => setShowAbandon(true)}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition-colors disabled:opacity-50 ml-auto"
            >
              <XCircle className="w-3.5 h-3.5" />
              Desistência
            </button>
          </div>
        )}

        {/* Abandon form */}
        {showAbandon && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
            <p className="text-xs font-semibold text-red-700">Motivo da desistência</p>
            <select
              value={abandonReason}
              onChange={(e) => setAbandonReason(e.target.value)}
              className="w-full px-2.5 py-2 text-xs bg-white border border-red-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              <option value="">Selecione um motivo...</option>
              {abandonReasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => run('abandon', () => abandonQueue(entry.id, abandonReason || undefined))}
                disabled={isPending}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {loading('abandon') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                Confirmar
              </button>
              <button
                onClick={() => setShowAbandon(false)}
                className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
