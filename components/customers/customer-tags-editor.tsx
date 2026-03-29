'use client'

import { useState, useTransition } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import { addCustomerTag, removeCustomerTag } from '@/lib/actions/customers'

type Tag = { id: string; tag: string }

export function CustomerTagsEditor({ customerId, tags }: { customerId: string; tags: Tag[] }) {
  const [isPending, startTransition] = useTransition()
  const [newTag, setNewTag] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)

  function handleAdd() {
    const clean = newTag.trim()
    if (!clean) return
    setNewTag('')
    startTransition(async () => {
      await addCustomerTag(customerId, clean)
    })
  }

  function handleRemove(tagId: string) {
    setRemovingId(tagId)
    startTransition(async () => {
      await removeCustomerTag(tagId, customerId)
      setRemovingId(null)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 group"
          >
            {t.tag}
            <button
              onClick={() => handleRemove(t.id)}
              disabled={isPending && removingId === t.id}
              className="ml-0.5 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
            >
              {isPending && removingId === t.id
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <X className="w-3 h-3" />
              }
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <p className="text-xs text-slate-400">Nenhuma tag adicionada</p>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          placeholder="Nova tag..."
          className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all"
        />
        <button
          onClick={handleAdd}
          disabled={isPending || !newTag.trim()}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
        >
          {isPending && !removingId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Adicionar
        </button>
      </div>
    </div>
  )
}
