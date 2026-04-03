'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { createBlock, BlockFormState } from '@/lib/actions/blocks'
import { WEEKDAY_LABELS } from '@/lib/queries/blocks'

const inputClass = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-white'
const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
    >
      {pending ? 'Salvando...' : 'Criar Bloqueio'}
    </button>
  )
}

export function BlockForm({ unitId }: { unitId: string }) {
  const [state, action] = useFormState(createBlock, {} as BlockFormState)

  // Controles de UI
  const [blockContent, setBlockContent] = useState<'allDay' | 'period' | 'timeRange'>('allDay')
  const [frequency, setFrequency]       = useState<'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly'>('once')

  const needsDate    = frequency === 'once' || frequency === 'biweekly' || frequency === 'monthly'
  const needsWeekDay = frequency === 'weekly' || frequency === 'biweekly'

  return (
    <form action={action} className="space-y-6">
      {state.success && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
          {state.message}
        </div>
      )}
      <input type="hidden" name="unitId" value={unitId} />

      {/* Mensagem de erro global */}
      {state.message && !state.success && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* ── O que bloquear ─────────────────────────────────────────────── */}
      <fieldset className="space-y-3">
        <legend className="text-base font-semibold text-slate-900">O que bloquear</legend>

        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'allDay',    label: 'Dia inteiro' },
            { value: 'period',    label: 'Período' },
            { value: 'timeRange', label: 'Intervalo' },
          ].map(({ value, label }) => (
            <label
              key={value}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
                blockContent === value
                  ? 'bg-red-50 border-red-400 text-red-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                className="sr-only"
                name="_blockContent"
                value={value}
                checked={blockContent === value}
                onChange={() => setBlockContent(value as typeof blockContent)}
              />
              {label}
            </label>
          ))}
        </div>

        {/* Dia inteiro: checkbox oculto */}
        {blockContent === 'allDay' && (
          <input type="hidden" name="allDay" value="on" />
        )}

        {/* Período */}
        {blockContent === 'period' && (
          <div>
            <label className={labelClass}>Período</label>
            <select name="period" className={inputClass} required>
              <option value="">Selecione...</option>
              <option value="morning">Manhã (06h – 12h)</option>
              <option value="lunch">Almoço (12h – 15h)</option>
              <option value="afternoon">Tarde (12h – 18h)</option>
              <option value="evening">Noite (18h – 24h)</option>
            </select>
          </div>
        )}

        {/* Intervalo de horário */}
        {blockContent === 'timeRange' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Das</label>
              <input type="time" name="startTime" className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Até</label>
              <input type="time" name="endTime" className={inputClass} required />
            </div>
          </div>
        )}
      </fieldset>

      {/* ── Frequência ─────────────────────────────────────────────────── */}
      <fieldset className="space-y-3">
        <legend className="text-base font-semibold text-slate-900">Frequência</legend>

        <div>
          <label className={labelClass}>Repetição</label>
          <select
            name="frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as typeof frequency)}
            className={inputClass}
          >
            <option value="once">Uma vez (data específica)</option>
            <option value="daily">Todos os dias</option>
            <option value="weekly">Semanal (ex: toda segunda)</option>
            <option value="biweekly">Quinzenal</option>
            <option value="monthly">Mensal (mesmo dia todo mês)</option>
          </select>
        </div>

        {/* Dia da semana */}
        {needsWeekDay && (
          <div>
            <label className={labelClass}>
              {frequency === 'biweekly' ? 'Dia da semana de referência' : 'Dia da semana'}
            </label>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAY_LABELS.map((label, idx) => (
                <label
                  key={idx}
                  className="flex flex-col items-center gap-1 cursor-pointer group"
                >
                  <input type="radio" name="weekDay" value={idx} className="sr-only peer" required />
                  <span className="w-full text-center py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 peer-checked:bg-red-50 peer-checked:border-red-400 peer-checked:text-red-700 hover:bg-slate-50 transition-colors">
                    {label.slice(0, 3)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Data */}
        {needsDate && (
          <div>
            <label className={labelClass}>
              {frequency === 'once'     && 'Data do bloqueio'}
              {frequency === 'biweekly' && 'Data de início (referência quinzenal)'}
              {frequency === 'monthly'  && 'Data de referência (dia do mês)'}
            </label>
            <input type="date" name="date" className={inputClass} required />
            {frequency === 'monthly' && (
              <p className="text-xs text-slate-400 mt-1">
                O sistema usará o dia do mês desta data para bloquear mensalmente.
              </p>
            )}
          </div>
        )}
      </fieldset>

      {/* ── Nota (opcional) ────────────────────────────────────────────── */}
      <div>
        <label className={labelClass}>Nota interna (opcional)</label>
        <input
          type="text"
          name="label"
          placeholder="Ex: Feriado, evento privado, manutenção..."
          className={inputClass}
        />
      </div>

      {/* ── Submit ─────────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-2">
        <a
          href="/bloqueios"
          className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </a>
        <SubmitButton />
      </div>
    </form>
  )
}
