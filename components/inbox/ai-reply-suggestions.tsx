'use client'

import { useState, useTransition } from 'react'
import { Sparkles, Loader2, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { getAISuggestedReplies } from '@/lib/actions/ai'

type Props = {
  conversationId: string
  onSelect: (text: string) => void
}

const INTENT_COLORS: Record<string, string> = {
  reservation_inquiry: 'bg-green-50 text-green-700',
  queue_inquiry:       'bg-yellow-50 text-yellow-700',
  menu_inquiry:        'bg-orange-50 text-orange-700',
  complaint:           'bg-red-50 text-red-700',
  cancellation:        'bg-red-50 text-red-600',
  confirmation:        'bg-blue-50 text-blue-700',
  greeting:            'bg-purple-50 text-purple-700',
  farewell:            'bg-slate-100 text-slate-600',
  other:               'bg-slate-100 text-slate-600',
}

export function AIReplySuggestions({ conversationId, onSelect }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'mock' | 'claude'>(
    process.env.NEXT_PUBLIC_AI_MODE === 'claude' ? 'claude' : 'mock'
  )

  function fetchSuggestions() {
    if (open) { setOpen(false); return }
    setError(null)
    startTransition(async () => {
      const result = await getAISuggestedReplies(conversationId)
      if ('error' in result && result.error) {
        setError(result.error)
        return
      }
      setSuggestions((result as any).suggestions ?? [])
      setOpen(true)
    })
  }

  return (
    <div className="border-t border-slate-100 px-3 py-2">
      <button
        onClick={fetchSuggestions}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )}
        Sugestões IA
        {!isPending && (open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
        <span className="text-[9px] text-purple-400 ml-0.5 uppercase tracking-wide">
          {mode === 'claude' ? 'Claude' : 'Mock'}
        </span>
      </button>

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}

      {open && suggestions.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => { onSelect(s); setOpen(false) }}
              className="w-full text-left text-xs px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 transition-colors border border-purple-100 flex items-start gap-2"
            >
              <Zap className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
