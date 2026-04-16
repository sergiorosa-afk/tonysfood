'use client'

import { useEffect, useState } from 'react'
import {
  X, Loader2, Users, CheckCircle, AlertTriangle,
  UtensilsCrossed, Link2, Plus, Minus,
} from 'lucide-react'

// Célula menor para caber no modal
const CELL = 54
const COLS = 14
const ROWS = 10

// ─── Types ────────────────────────────────────────────────────────────────────

type MesaApi = {
  id: string
  numero: number
  capacidade: number
  forma: string
  status: string
  posX: number
  posY: number
  largura: number
  altura: number
  queueEntries: { id: string; guestName: string; partySize: number; status: string }[]
}

type GrupoApi = {
  id: string
  capacidade: number
  mesas: { mesaId: string }[]
  queueEntries: { id: string; guestName: string; partySize: number; status: string }[]
}

export type AlocacaoConfirmada = {
  mesaId: string
  mesaNumero: number
  mesaGrupoId?: string
  numerosGrupo?: number[]
}

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: (alocacao: AlocacaoConfirmada) => void
  unitId: string
  guestName: string
  partySize: number
  isConfirming: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AlocarMesaModal({
  open, onClose, onConfirm,
  unitId, guestName, partySize, isConfirming,
}: Props) {
  const [mesas, setMesas]   = useState<MesaApi[]>([])
  const [grupos, setGrupos] = useState<GrupoApi[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro]     = useState('')

  const [selectedMesaId,  setSelectedMesaId]  = useState<string | null>(null)
  const [selectedGrupoId, setSelectedGrupoId] = useState<string | null>(null)
  const [extraCadeiras, setExtraCadeiras]     = useState(0)

  // mesaId → grupoId lookup
  const mesaParaGrupo = new Map<string, string>()
  grupos.forEach((g) => g.mesas.forEach((gi) => mesaParaGrupo.set(gi.mesaId, g.id)))

  // Busca mesas ao abrir
  useEffect(() => {
    if (!open) return
    setSelectedMesaId(null)
    setSelectedGrupoId(null)
    setExtraCadeiras(0)
    setErro('')
    setLoading(true)

    fetch(`/api/mesas?unitId=${unitId}`)
      .then((r) => r.json())
      .then((data) => {
        setMesas(data.mesas ?? [])
        setGrupos(data.grupos ?? [])
      })
      .catch(() => setErro('Não foi possível carregar o mapa de mesas.'))
      .finally(() => setLoading(false))
  }, [open, unitId])

  if (!open) return null

  // ── Derived ────────────────────────────────────────────────────────────────

  const selectedMesa  = mesas.find((m) => m.id === selectedMesaId) ?? null
  const selectedGrupo = grupos.find((g) => g.id === selectedGrupoId) ?? null

  const capacidadeDisponivel = selectedGrupo
    ? selectedGrupo.capacidade + extraCadeiras
    : selectedMesa
    ? selectedMesa.capacidade + extraCadeiras
    : 0

  const capacidadeOk  = capacidadeDisponivel >= partySize
  const capacidadeFolga = capacidadeDisponivel - partySize

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleMesaClick(mesaId: string) {
    const mesa = mesas.find((m) => m.id === mesaId)
    if (!mesa || mesa.status !== 'LIVRE') return

    const grupoId = mesaParaGrupo.get(mesaId)

    if (grupoId) {
      // Clique em mesa de grupo → seleciona o grupo inteiro
      const grupo = grupos.find((g) => g.id === grupoId)
      // Grupo disponível apenas se não tiver ocupação ativa
      if (grupo && grupo.queueEntries.length > 0) return
      setSelectedGrupoId((p) => (p === grupoId ? null : grupoId))
      setSelectedMesaId(null)
    } else {
      setSelectedMesaId((p) => (p === mesaId ? null : mesaId))
      setSelectedGrupoId(null)
    }
    setExtraCadeiras(0)
  }

  function handleConfirm() {
    if (selectedGrupo) {
      // Usa a primeira mesa do grupo como referência de número
      const primeirasMesas = mesas.filter((m) =>
        selectedGrupo.mesas.some((gi) => gi.mesaId === m.id)
      ).sort((a, b) => a.numero - b.numero)

      const primeira = primeirasMesas[0]
      if (!primeira) return

      onConfirm({
        mesaId:      primeira.id,
        mesaNumero:  primeira.numero,
        mesaGrupoId: selectedGrupo.id,
        numerosGrupo: primeirasMesas.map((m) => m.numero),
      })
    } else if (selectedMesa) {
      onConfirm({
        mesaId:     selectedMesa.id,
        mesaNumero: selectedMesa.numero,
      })
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-blue-500" />
              Selecionar Mesa
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              <strong>{guestName}</strong> · {partySize} {partySize === 1 ? 'pessoa' : 'pessoas'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Grid */}
          <div className="flex-1 overflow-auto p-4">
            {loading && (
              <div className="flex items-center justify-center h-64 gap-2 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Carregando mapa de mesas...</span>
              </div>
            )}

            {erro && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {erro}
              </div>
            )}

            {!loading && !erro && (
              <div className="space-y-3">
                {/* Legenda */}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-400" />Livre — clicável</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" />Ocupada</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" />Grupo</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" />Selecionada</span>
                </div>

                {/* Mapa */}
                <div
                  className="relative bg-slate-50 border-2 border-slate-200 rounded-xl flex-shrink-0"
                  style={{ width: COLS * CELL, height: ROWS * CELL, minWidth: COLS * CELL }}
                >
                  {/* Grid lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                    {Array.from({ length: COLS + 1 }).map((_, i) => (
                      <line key={`v${i}`} x1={i * CELL} y1={0} x2={i * CELL} y2={ROWS * CELL} stroke="#94a3b8" strokeWidth="1" />
                    ))}
                    {Array.from({ length: ROWS + 1 }).map((_, i) => (
                      <line key={`h${i}`} x1={0} y1={i * CELL} x2={COLS * CELL} y2={i * CELL} stroke="#94a3b8" strokeWidth="1" />
                    ))}
                  </svg>

                  {/* Mesas */}
                  {mesas.map((mesa) => {
                    const grupoId     = mesaParaGrupo.get(mesa.id)
                    const emGrupo     = Boolean(grupoId)
                    const isOcupada   = mesa.status !== 'LIVRE'
                    const isRedonda   = mesa.forma === 'redonda'
                    const isSelMesa   = selectedMesaId === mesa.id
                    const isSelGrupo  = !!grupoId && selectedGrupoId === grupoId

                    // Grupo ocupado = não clicável
                    const grupoOcupado = emGrupo && grupos.find((g) => g.id === grupoId)?.queueEntries.length
                    const naoClicavel  = isOcupada || Boolean(grupoOcupado)
                    const isSelected   = isSelMesa || isSelGrupo

                    let border = 'border-green-400'
                    let bg     = 'bg-green-50'
                    let layer  = 'bg-green-400'
                    let text   = 'text-green-700'

                    if (emGrupo)  { border = 'border-amber-400'; bg = 'bg-amber-50'; layer = 'bg-amber-300'; text = 'text-amber-700' }
                    if (isOcupada && !emGrupo) { border = 'border-red-400'; bg = 'bg-red-50'; layer = 'bg-red-400'; text = 'text-red-700' }
                    if (isSelected) { border = 'border-blue-500'; bg = 'bg-blue-50'; layer = 'bg-blue-400'; text = 'text-blue-700' }

                    return (
                      <div
                        key={mesa.id}
                        onClick={() => !naoClicavel && handleMesaClick(mesa.id)}
                        className={[
                          'absolute border-2 flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-150',
                          border, bg,
                          isRedonda ? 'rounded-full' : 'rounded-xl',
                          naoClicavel ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:shadow-md hover:scale-[1.02]',
                          emGrupo && !isSelGrupo ? 'border-dashed' : 'border-solid',
                          isSelected ? 'ring-2 ring-blue-400 ring-offset-1 shadow-lg z-10' : 'z-[1]',
                        ].join(' ')}
                        style={{
                          left:   mesa.posX * CELL + 3,
                          top:    mesa.posY * CELL + 3,
                          width:  mesa.largura * CELL - 6,
                          height: mesa.altura * CELL - 6,
                        }}
                      >
                        {/* Layer de cor */}
                        <div className={`absolute inset-0 ${isRedonda ? 'rounded-full' : 'rounded-xl'} opacity-30 ${layer}`} />

                        {/* Badge grupo */}
                        {emGrupo && <div className="absolute top-0.5 left-0.5 bg-amber-500 text-white text-[7px] font-bold px-1 rounded leading-none">G</div>}

                        {/* Checkmark seleção */}
                        {isSelected && <div className="absolute top-0.5 right-0.5"><CheckCircle className="w-3 h-3 text-blue-600" /></div>}

                        {/* Conteúdo */}
                        <div className="relative flex flex-col items-center justify-center gap-0 text-center">
                          <span className={`font-black leading-none ${text}`}
                            style={{ fontSize: mesa.largura >= 2 ? '1.2rem' : '0.95rem' }}>
                            {mesa.numero}
                          </span>
                          {!isOcupada && (
                            <span className={`text-[8px] font-medium leading-tight ${text} opacity-80`}>
                              {emGrupo && isSelGrupo
                                ? `${grupos.find(g => g.id === grupoId)?.capacidade ?? mesa.capacidade}px`
                                : `${mesa.capacidade}px`}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {mesas.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Nenhuma mesa cadastrada. Configure o salão em{' '}
                    <a href="/admin/planta" className="text-blue-500 underline">Admin → Planta</a>.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Painel lateral de confirmação */}
          <div className="w-72 flex-shrink-0 border-l border-slate-100 bg-slate-50/60 p-5 flex flex-col gap-4 overflow-y-auto">

            {/* Seleção atual */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Seleção</p>
              {!selectedMesa && !selectedGrupo && (
                <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg text-slate-400 text-sm">
                  <UtensilsCrossed className="w-4 h-4 flex-shrink-0" />
                  Clique numa mesa no mapa
                </div>
              )}

              {selectedMesa && !selectedGrupo && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
                  <p className="text-sm font-bold text-blue-800">Mesa {selectedMesa.numero}</p>
                  <p className="text-xs text-blue-600">{selectedMesa.capacidade} lugares · {selectedMesa.forma}</p>
                </div>
              )}

              {selectedGrupo && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-amber-800">
                    <Link2 className="w-3.5 h-3.5" />
                    Grupo de Mesas
                  </div>
                  <p className="text-xs text-amber-700">
                    {mesas
                      .filter((m) => selectedGrupo.mesas.some((gi) => gi.mesaId === m.id))
                      .sort((a, b) => a.numero - b.numero)
                      .map((m) => `Mesa ${m.numero}`)
                      .join(' + ')}
                  </p>
                  <p className="text-xs font-semibold text-amber-700">{selectedGrupo.capacidade} lugares no total</p>
                </div>
              )}
            </div>

            {/* Cliente */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Cliente</p>
              <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg">
                <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{guestName}</p>
                  <p className="text-xs text-slate-500">{partySize} {partySize === 1 ? 'pessoa' : 'pessoas'}</p>
                </div>
              </div>
            </div>

            {/* Cadeiras extras */}
            {(selectedMesa || selectedGrupo) && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Cadeiras extras</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExtraCadeiras((c) => Math.max(0, c - 1))}
                    className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="flex-1 text-center text-sm font-semibold text-slate-800">{extraCadeiras}</span>
                  <button
                    onClick={() => setExtraCadeiras((c) => c + 1)}
                    className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Cadeiras adicionadas sem criar grupo</p>
              </div>
            )}

            {/* Indicador de capacidade */}
            {(selectedMesa || selectedGrupo) && (
              <div className={`p-3 rounded-lg border ${capacidadeOk ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2">
                  {capacidadeOk
                    ? <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    : <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                  <div>
                    <p className={`text-sm font-semibold ${capacidadeOk ? 'text-green-800' : 'text-red-700'}`}>
                      {capacidadeDisponivel} lugares disponíveis
                    </p>
                    <p className={`text-xs ${capacidadeOk ? 'text-green-600' : 'text-red-500'}`}>
                      {capacidadeOk
                        ? capacidadeFolga > 0
                          ? `${capacidadeFolga} lugar${capacidadeFolga > 1 ? 'es' : ''} sobrando`
                          : 'Capacidade exata'
                        : `Faltam ${partySize - capacidadeDisponivel} lugar${partySize - capacidadeDisponivel > 1 ? 'es' : ''} — adicione cadeiras extras ou escolha outra mesa`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botão confirmar */}
            <div className="mt-auto pt-2">
              <button
                onClick={handleConfirm}
                disabled={(!selectedMesa && !selectedGrupo) || isConfirming}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isConfirming
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Chamando...</>
                  : <><CheckCircle className="w-4 h-4" />Confirmar Alocação</>}
              </button>
              {!selectedMesa && !selectedGrupo && (
                <p className="text-[10px] text-slate-400 text-center mt-1">Selecione uma mesa no mapa para continuar</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
