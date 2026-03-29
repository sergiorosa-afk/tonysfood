'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { Plus, Search, Loader2, User, X } from 'lucide-react'
import { searchCustomersForInbox, openOrCreateConversation } from '@/lib/actions/conversations'

type Customer = {
  id: string
  name: string
  phone: string | null
  email: string | null
  segment: string
}

export function NewConversationButton() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Customer[]>([])
  const [searching, setSearching] = useState(false)
  const [opening, startOpening] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  function handleSearch(value: string) {
    setQ(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) { setResults([]); return }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const res = await searchCustomersForInbox(value)
      setResults(res as Customer[])
      setSearching(false)
    }, 300)
  }

  function handleSelect(customerId: string) {
    startOpening(async () => {
      await openOrCreateConversation(customerId)
      setOpen(false)
      setQ('')
      setResults([])
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-7 h-7 rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition-colors"
        title="Nova conversa"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/10" onClick={() => { setOpen(false); setQ(''); setResults([]) }} />

      {/* Panel */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-semibold text-slate-700 flex-1">Nova conversa</p>
          <button onClick={() => { setOpen(false); setQ(''); setResults([]) }}
            className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          {searching && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 animate-spin" />}
          <input
            ref={inputRef}
            value={q}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar por nome, email ou telefone..."
            className="w-full pl-8 pr-8 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50"
          />
        </div>

        {results.length > 0 && (
          <div className="mt-2 space-y-0.5 max-h-56 overflow-y-auto">
            {results.map(c => (
              <button
                key={c.id}
                onClick={() => handleSelect(c.id)}
                disabled={opening}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left disabled:opacity-60"
              >
                <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium text-slate-800 truncate">{c.name}</p>
                    {c.segment === 'VIP' && (
                      <span className="text-[9px] font-bold px-1 py-0.5 bg-amber-100 text-amber-700 rounded">VIP</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{c.phone}{c.email ? ` · ${c.email}` : ''}</p>
                </div>
                {opening && <Loader2 className="w-3 h-3 text-slate-400 animate-spin shrink-0" />}
              </button>
            ))}
          </div>
        )}

        {q.length >= 2 && !searching && results.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-3">
            Nenhum cliente encontrado com telefone cadastrado
          </p>
        )}
      </div>
    </>
  )
}
