'use client'

import { useState, useTransition } from 'react'
import { X, Plus, Loader2, Save } from 'lucide-react'
import { updateCustomerPreferences } from '@/lib/actions/customers'

interface Props {
  customerId: string
  initialPreferences: string[]
  initialRestrictions: string[]
}

export function CustomerPreferencesEditor({ customerId, initialPreferences, initialRestrictions }: Props) {
  const [isPending, startTransition] = useTransition()
  const [preferences, setPreferences] = useState<string[]>(initialPreferences)
  const [restrictions, setRestrictions] = useState<string[]>(initialRestrictions)
  const [newPref, setNewPref] = useState('')
  const [newRestr, setNewRestr] = useState('')
  const [saved, setSaved] = useState(false)

  function addPref() {
    const clean = newPref.trim()
    if (!clean || preferences.includes(clean)) return
    setPreferences([...preferences, clean])
    setNewPref('')
    setSaved(false)
  }

  function addRestr() {
    const clean = newRestr.trim()
    if (!clean || restrictions.includes(clean)) return
    setRestrictions([...restrictions, clean])
    setNewRestr('')
    setSaved(false)
  }

  function removePref(item: string) {
    setPreferences(preferences.filter(p => p !== item))
    setSaved(false)
  }

  function removeRestr(item: string) {
    setRestrictions(restrictions.filter(r => r !== item))
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      await updateCustomerPreferences(customerId, preferences, restrictions)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const chipClass = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium'
  const inputClass = 'flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all'

  return (
    <div className="space-y-5">
      {/* Preferences */}
      <div>
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Preferências</p>
        <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
          {preferences.map(p => (
            <span key={p} className={`${chipClass} bg-blue-50 text-blue-700`}>
              {p}
              <button onClick={() => removePref(p)} className="text-blue-400 hover:text-blue-700 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {preferences.length === 0 && <p className="text-xs text-slate-400">Nenhuma preferência</p>}
        </div>
        <div className="flex gap-2">
          <input
            value={newPref}
            onChange={e => setNewPref(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPref() } }}
            placeholder="Ex: mesa-janela, vinho-tinto..."
            className={inputClass}
          />
          <button
            onClick={addPref}
            disabled={!newPref.trim()}
            className="px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Restrictions */}
      <div>
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Restrições Alimentares</p>
        <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
          {restrictions.map(r => (
            <span key={r} className={`${chipClass} bg-red-50 text-red-700`}>
              {r}
              <button onClick={() => removeRestr(r)} className="text-red-400 hover:text-red-700 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {restrictions.length === 0 && <p className="text-xs text-slate-400">Nenhuma restrição</p>}
        </div>
        <div className="flex gap-2">
          <input
            value={newRestr}
            onChange={e => setNewRestr(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRestr() } }}
            placeholder="Ex: gluten, lactose, amendoim..."
            className={inputClass}
          />
          <button
            onClick={addRestr}
            disabled={!newRestr.trim()}
            className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={isPending}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          saved
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-slate-900 hover:bg-slate-700 text-white'
        } disabled:opacity-50`}
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? 'Salvo!' : 'Salvar Preferências'}
      </button>
    </div>
  )
}
