'use client'

import { useTransition } from 'react'
import {
  CheckCircle, XCircle, RotateCcw, Clock, Loader2, ArrowRightCircle
} from 'lucide-react'
import {
  resolveConversation,
  closeConversation,
  reopenConversation,
  markPending,
} from '@/lib/actions/inbox'

type Props = {
  conversationId: string
  status: string
}

export function ConversationActions({ conversationId, status }: Props) {
  const [isPending, startTransition] = useTransition()

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => { await fn() })
  }

  const isOpen = status === 'OPEN'
  const isPendingStatus = status === 'PENDING'
  const isResolved = status === 'RESOLVED'
  const isClosed = status === 'CLOSED'

  return (
    <div className="flex flex-wrap gap-2">
      {(isOpen || isPendingStatus) && (
        <button
          onClick={() => run(() => resolveConversation(conversationId))}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
          Resolver
        </button>
      )}

      {isOpen && (
        <button
          onClick={() => run(() => markPending(conversationId))}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs font-semibold transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
          Pendente
        </button>
      )}

      {(isResolved || isPendingStatus) && (
        <button
          onClick={() => run(() => reopenConversation(conversationId))}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
          Reabrir
        </button>
      )}

      {!isClosed && (
        <button
          onClick={() => run(() => closeConversation(conversationId))}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
          Fechar
        </button>
      )}

      {isClosed && (
        <button
          onClick={() => run(() => reopenConversation(conversationId))}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightCircle className="w-3.5 h-3.5" />}
          Reabrir
        </button>
      )}
    </div>
  )
}
