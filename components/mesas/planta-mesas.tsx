'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw, Users, Clock, CheckCircle, XCircle } from 'lucide-react'
import { liberarMesa } from '@/lib/actions/mesas'

// Deve bater com CELL do editor
const CELL = 72
const COLS = 14
const ROWS = 10

type OcupacaoEntry = {
  id: string
  guestName: string
  partySize: number
  status: string
  calledAt: string | null
}

type MesaOp = {
  id: string
  numero: number
  capacidade: number
  forma: string
  status: string
  posX: number
  posY: number
  largura: number
  altura: number
  queueEntries: OcupacaoEntry[]
}

type GrupoOp = {
  id: string
  capacidade: number
  mesas: { mesaId: string }[]
  queueEntries: { id: string; guestName: string; partySize: number; status: string }[]
}

type Props = {
  mesas: MesaOp[]
  grupos: GrupoOp[]
}

export function PlantaMesas({ mesas: initialMesas, grupos }: Props) {
  const router = useRouter()
  const [mesas, setMesas] = useState(initialMesas)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [liberandoId, setLiberandoId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [countdown, setCountdown] = useState(30)

  // Auto-refresh a cada 30s
  useState(() => {
    const refresh = setInterval(() => { router.refresh(); setCountdown(30) }, 30000)
    const tick   = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 30)), 1000)
    return () => { clearInterval(refresh); clearInterval(tick) }
  })

  function handleRefresh() {
    router.refresh()
    setCountdown(30)
  }

  function handleLiberar(mesaId: string) {
    setLiberandoId(mesaId)
    startTransition(async () => {
      await liberarMesa(mesaId)
      // Optimistic: marca como LIVRE localmente
      setMesas((prev) =>
        prev.map((m) =>
          m.id === mesaId
            ? { ...m, status: 'LIVRE', queueEntries: [] }
            : m
        )
      )
      setSelectedId(null)
      setLiberandoId(null)
    })
  }

  const selected = mesas.find((m) => m.id === selectedId) ?? null

  // IDs de mesas que pertencem a algum grupo ativo
  const mesasEmGrupo = new Set(grupos.flatMap((g) => g.mesas.map((gi) => gi.mesaId)))

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
            Livre
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
            Ocupada
          </span>
          <span className="flex items-center gap-1.5 text-slate-400 text-xs">
            Clique numa mesa ocupada para liberar
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
        >
          <RefreshCw className="w-3 h-3" />
          Atualiza em {countdown}s
        </button>
      </div>

      <div className="flex gap-4 items-start flex-wrap">
        {/* Grid */}
        <div className="flex-1 overflow-x-auto">
          <div
            className="relative bg-slate-50 border-2 border-slate-200 rounded-xl"
            style={{ width: COLS * CELL, height: ROWS * CELL, minWidth: COLS * CELL }}
          >
            {/* Grid lines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
              xmlns="http://www.w3.org/2000/svg"
            >
              {Array.from({ length: COLS + 1 }).map((_, i) => (
                <line key={`v${i}`} x1={i * CELL} y1={0} x2={i * CELL} y2={ROWS * CELL} stroke="#94a3b8" strokeWidth="1" />
              ))}
              {Array.from({ length: ROWS + 1 }).map((_, i) => (
                <line key={`h${i}`} x1={0} y1={i * CELL} x2={COLS * CELL} y2={i * CELL} stroke="#94a3b8" strokeWidth="1" />
              ))}
            </svg>

            {/* Mesas */}
            {mesas.map((mesa) => {
              const ocupacao = mesa.queueEntries[0] ?? null
              const isOcupada = mesa.status === 'OCUPADA'
              const isSelected = selectedId === mesa.id
              const isRedonda = mesa.forma === 'redonda'

              const borderColor = isSelected
                ? 'border-blue-500'
                : isOcupada
                ? 'border-red-400'
                : 'border-green-400'

              const bgColor = isOcupada ? 'bg-red-50' : 'bg-green-50'

              const minutosOcupada = ocupacao?.calledAt
                ? Math.floor((Date.now() - new Date(ocupacao.calledAt).getTime()) / 60000)
                : null

              return (
                <div
                  key={mesa.id}
                  onClick={() => setSelectedId(isSelected ? null : mesa.id)}
                  className={`
                    absolute border-2 ${borderColor} ${bgColor}
                    ${isRedonda ? 'rounded-full' : 'rounded-xl'}
                    flex flex-col items-center justify-center
                    cursor-pointer select-none overflow-hidden
                    transition-all duration-200
                    ${isSelected ? 'ring-2 ring-blue-400 ring-offset-1 shadow-lg' : 'hover:shadow-md'}
                    ${isOcupada ? 'hover:border-red-500' : 'hover:border-green-500'}
                  `}
                  style={{
                    left:   mesa.posX * CELL + 3,
                    top:    mesa.posY * CELL + 3,
                    width:  mesa.largura * CELL - 6,
                    height: mesa.altura * CELL - 6,
                    zIndex: isSelected ? 10 : 1,
                  }}
                >
                  {/* Layer de status */}
                  <div className={`
                    absolute inset-0 ${isRedonda ? 'rounded-full' : 'rounded-xl'} opacity-30
                    ${isOcupada ? 'bg-red-400' : 'bg-green-400'}
                  `} />

                  {/* Conteúdo */}
                  <div className="relative flex flex-col items-center justify-center gap-0.5 px-1 text-center">
                    <span className={`font-black leading-none ${isOcupada ? 'text-red-700' : 'text-green-700'}`}
                      style={{ fontSize: mesa.largura >= 2 ? '1.5rem' : '1.1rem' }}>
                      {mesa.numero}
                    </span>

                    {ocupacao && mesa.largura >= 2 && (
                      <>
                        <span className="text-[9px] font-semibold text-red-600 truncate max-w-full px-1 leading-tight">
                          {ocupacao.guestName.split(' ')[0]}
                        </span>
                        <span className="text-[9px] text-red-500 flex items-center gap-0.5">
                          <Users className="w-2.5 h-2.5" />
                          {ocupacao.partySize}
                          {minutosOcupada !== null && (
                            <span className="ml-1 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {minutosOcupada}min
                            </span>
                          )}
                        </span>
                      </>
                    )}

                    {!isOcupada && (
                      <span className="text-[9px] text-green-600 font-medium">
                        {mesa.capacidade}px
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Painel lateral de detalhes */}
        {selected && (
          <MesaDetailPanel
            mesa={selected}
            isLiberando={liberandoId === selected.id && isPending}
            onLiberar={() => handleLiberar(selected.id)}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  )
}

// ─── Painel de detalhe / ação ─────────────────────────────────────────────────

type PanelProps = {
  mesa: MesaOp
  isLiberando: boolean
  onLiberar: () => void
  onClose: () => void
}

function MesaDetailPanel({ mesa, isLiberando, onLiberar, onClose }: PanelProps) {
  const ocupacao = mesa.queueEntries[0] ?? null
  const isOcupada = mesa.status === 'OCUPADA'

  const minutosOcupada = ocupacao?.calledAt
    ? Math.floor((Date.now() - new Date(ocupacao.calledAt).getTime()) / 60000)
    : null

  const [confirming, setConfirming] = useState(false)

  return (
    <div className={`w-64 flex-shrink-0 rounded-xl border-2 p-4 space-y-4 ${
      isOcupada ? 'border-red-200 bg-red-50/50' : 'border-green-200 bg-green-50/50'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
            isOcupada ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {mesa.numero}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Mesa {mesa.numero}</p>
            <p className="text-xs text-slate-400">{mesa.capacidade} lugares · {mesa.forma}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
      </div>

      {/* Status badge */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
        isOcupada ? 'bg-red-100' : 'bg-green-100'
      }`}>
        {isOcupada
          ? <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          : <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
        }
        <span className={`text-sm font-semibold ${isOcupada ? 'text-red-700' : 'text-green-700'}`}>
          {isOcupada ? 'Ocupada' : 'Livre'}
        </span>
      </div>

      {/* Ocupação info */}
      {ocupacao && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span><strong>{ocupacao.guestName}</strong> · {ocupacao.partySize} {ocupacao.partySize === 1 ? 'pessoa' : 'pessoas'}</span>
          </div>
          {minutosOcupada !== null && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>Sentada há {minutosOcupada} {minutosOcupada === 1 ? 'minuto' : 'minutos'}</span>
            </div>
          )}
          <div className="text-xs text-slate-400 capitalize">
            Status: {ocupacao.status === 'CALLED' ? 'Chamado' : 'Sentado'}
          </div>
        </div>
      )}

      {/* Liberar mesa */}
      {isOcupada && (
        <div className="pt-1">
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Liberar Mesa
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-600 font-medium">Confirmar liberação da Mesa {mesa.numero}?</p>
              <div className="flex gap-2">
                <button
                  onClick={onLiberar}
                  disabled={isLiberando}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isLiberando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Confirmar
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!isOcupada && (
        <p className="text-xs text-slate-400 text-center py-1">
          Mesa disponível para receber clientes
        </p>
      )}
    </div>
  )
}
