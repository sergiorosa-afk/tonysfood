'use client'

import { useState, useTransition } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import { createMesa } from '@/lib/actions/mesas'
import type { MesaData } from './mesa-card-editor'

type Props = {
  unitId: string
  existingNumbers: number[]
  onAdded: (mesa: MesaData) => void
  onClose: () => void
}

export function AddMesaPanel({ unitId, existingNumbers, onAdded, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const nextNumber = Math.max(0, ...existingNumbers) + 1

  const [form, setForm] = useState({
    numero:    nextNumber,
    capacidade: 4,
    forma:     'retangular',
    largura:   1,
    altura:    1,
  })

  function set(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }))
    setError('')
  }

  function handleSubmit() {
    if (existingNumbers.includes(form.numero)) {
      setError(`Já existe uma Mesa ${form.numero}`)
      return
    }

    const fd = new FormData()
    fd.append('unitId', unitId)
    fd.append('numero', String(form.numero))
    fd.append('capacidade', String(form.capacidade))
    fd.append('forma', form.forma)
    fd.append('largura', String(form.largura))
    fd.append('altura', String(form.altura))
    fd.append('posX', '0')
    fd.append('posY', '0')

    startTransition(async () => {
      const result = await createMesa({ success: false }, fd)
      if (result.success) {
        // Monta objeto localmente para update otimístico
        const nova: MesaData = {
          id: Date.now().toString(), // temporário, página vai refresh
          ...form,
          status: 'LIVRE',
          posX: 0,
          posY: 0,
        }
        onAdded(nova)
      } else {
        const firstError = result.errors
          ? Object.values(result.errors).flat()[0]
          : result.message
        setError(firstError ?? 'Erro ao criar mesa')
      }
    })
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-slate-500" />
          Nova Mesa
        </p>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <Field label="Número da mesa">
          <input
            type="number" min={1}
            value={form.numero}
            onChange={(e) => set('numero', parseInt(e.target.value) || 1)}
            className={inputCls}
          />
        </Field>

        <Field label="Capacidade (lugares)">
          <input
            type="number" min={1} max={20}
            value={form.capacidade}
            onChange={(e) => set('capacidade', parseInt(e.target.value) || 1)}
            className={inputCls}
          />
        </Field>

        <Field label="Forma">
          <select
            value={form.forma}
            onChange={(e) => set('forma', e.target.value)}
            className={inputCls}
          >
            <option value="retangular">Retangular</option>
            <option value="redonda">Redonda</option>
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Largura (cel)">
            <input
              type="number" min={1} max={4}
              value={form.largura}
              onChange={(e) => set('largura', parseInt(e.target.value) || 1)}
              className={inputCls}
            />
          </Field>
          <Field label="Altura (cel)">
            <input
              type="number" min={1} max={4}
              value={form.altura}
              onChange={(e) => set('altura', parseInt(e.target.value) || 1)}
              className={inputCls}
            />
          </Field>
        </div>

        <p className="text-[11px] text-slate-400">
          A mesa será criada na posição (0,0). Arraste no grid para posicionar.
        </p>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Adicionar Mesa
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white'
