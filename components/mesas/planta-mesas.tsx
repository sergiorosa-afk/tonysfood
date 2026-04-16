'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2, RefreshCw, Users, Clock, CheckCircle, XCircle,
  Link2, Link2Off, LayoutGrid,
} from 'lucide-react'
import { liberarMesa, criarGrupo, dissolverGrupo } from '@/lib/actions/mesas'

const CELL = 72
const COLS = 14
const ROWS = 10

// ─── Types ────────────────────────────────────────────────────────────────────

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
  unitId: string
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PlantaMesas({ mesas: init, grupos: initGrupos, unitId }: Props) {
  const router = useRouter()
  const [mesas, setMesas] = useState(init)
  const [grupos, setGrupos] = useState(initGrupos)
  const [isPending, startTransition] = useTransition()

  // Normal mode selection
  const [selectedMesaId, setSelectedMesaId]   = useState<string | null>(null)
  const [selectedGrupoId, setSelectedGrupoId] = useState<string | null>(null)
  const [liberandoId, setLiberandoId]         = useState<string | null>(null)
  const [dissolvendoId, setDissolvendoId]     = useState<string | null>(null)

  // Join mode
  const [modoJuntar, setModoJuntar]   = useState(false)
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const [juntando, setJuntando]       = useState(false)
  const [erroJuntar, setErroJuntar]   = useState('')

  // Auto-refresh 30 s
  const [countdown, setCountdown] = useState(30)
  useEffect(() => {
    const r = setInterval(() => { router.refresh(); setCountdown(30) }, 30000)
    const t = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 30)), 1000)
    return () => { clearInterval(r); clearInterval(t) }
  }, [router])

  // mesaId → grupoId lookup
  const mesaParaGrupo = new Map<string, string>()
  grupos.forEach((g) => g.mesas.forEach((gi) => mesaParaGrupo.set(gi.mesaId, g.id)))

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleRefresh() { router.refresh(); setCountdown(30) }

  function handleMesaClick(mesaId: string) {
    const mesa = mesas.find((m) => m.id === mesaId)
    if (!mesa) return

    // Join mode: só seleciona mesas LIVRE não agrupadas
    if (modoJuntar) {
      if (mesa.status !== 'LIVRE' || mesaParaGrupo.has(mesaId)) return
      setErroJuntar('')
      setSelecionadas((prev) => {
        const n = new Set(prev)
        n.has(mesaId) ? n.delete(mesaId) : n.add(mesaId)
        return n
      })
      return
    }

    // Modo normal: clique em mesa de grupo → abre painel do grupo
    const grupoId = mesaParaGrupo.get(mesaId)
    if (grupoId) {
      setSelectedGrupoId((p) => (p === grupoId ? null : grupoId))
      setSelectedMesaId(null)
      return
    }

    setSelectedMesaId((p) => (p === mesaId ? null : mesaId))
    setSelectedGrupoId(null)
  }

  function handleLiberar(mesaId: string) {
    setLiberandoId(mesaId)
    startTransition(async () => {
      await liberarMesa(mesaId)
      setMesas((p) => p.map((m) => m.id === mesaId ? { ...m, status: 'LIVRE', queueEntries: [] } : m))
      setSelectedMesaId(null)
      setLiberandoId(null)
    })
  }

  function handleJuntar() {
    if (selecionadas.size < 2) { setErroJuntar('Selecione pelo menos 2 mesas.'); return }
    setJuntando(true)
    setErroJuntar('')
    startTransition(async () => {
      try {
        const grupo = await criarGrupo(unitId, Array.from(selecionadas))
        setMesas((p) => p.map((m) => selecionadas.has(m.id) ? { ...m, status: 'OCUPADA' } : m))
        setGrupos((p) => [...p, {
          id:           grupo.id,
          capacidade:   grupo.capacidade,
          mesas:        grupo.mesas.map((gi: any) => ({ mesaId: gi.mesaId })),
          queueEntries: [],
        }])
        setSelecionadas(new Set())
        setModoJuntar(false)
        router.refresh()
      } catch (err: any) {
        setErroJuntar(err?.message ?? 'Erro ao juntar mesas.')
      } finally {
        setJuntando(false)
      }
    })
  }

  function handleDissolver(grupoId: string) {
    setDissolvendoId(grupoId)
    const g = grupos.find((gr) => gr.id === grupoId)
    startTransition(async () => {
      await dissolverGrupo(grupoId)
      const ids = new Set(g?.mesas.map((gi) => gi.mesaId) ?? [])
      setMesas((p) => p.map((m) => ids.has(m.id) ? { ...m, status: 'LIVRE' } : m))
      setGrupos((p) => p.filter((gr) => gr.id !== grupoId))
      setSelectedGrupoId(null)
      setDissolvendoId(null)
      router.refresh()
    })
  }

  function cancelarJuntar() { setModoJuntar(false); setSelecionadas(new Set()); setErroJuntar('') }

  // ── Derived ───────────────────────────────────────────────────────────────

  const selectedMesa  = mesas.find((m) => m.id === selectedMesaId) ?? null
  const selectedGrupo = grupos.find((g) => g.id === selectedGrupoId) ?? null
  const capacidadeSelecionada = mesas
    .filter((m) => selecionadas.has(m.id))
    .reduce((s, m) => s + m.capacidade, 0)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-400" />Livre</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" />Ocupada</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" />Grupo</span>
          {!modoJuntar && <span className="text-slate-400">Clique numa mesa para ver detalhes</span>}
          {modoJuntar && (
            <span className="flex items-center gap-1 font-semibold text-blue-600 animate-pulse">
              <LayoutGrid className="w-3 h-3" /> Modo junção ativo — selecione as mesas LIVRE
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!modoJuntar ? (
            <button
              onClick={() => { setModoJuntar(true); setSelectedMesaId(null); setSelectedGrupoId(null) }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              <Link2 className="w-3.5 h-3.5" />
              Juntar Mesas
            </button>
          ) : (
            <button
              onClick={cancelarJuntar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancelar Junção
            </button>
          )}
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
          >
            <RefreshCw className="w-3 h-3" />
            {countdown}s
          </button>
        </div>
      </div>

      {/* Grid + Side Panel */}
      <div className="flex gap-4 items-start flex-wrap">
        <div className="flex-1 overflow-x-auto">
          <div
            className="relative bg-slate-50 border-2 border-slate-200 rounded-xl"
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
              const grupoId      = mesaParaGrupo.get(mesa.id)
              const emGrupo      = Boolean(grupoId)
              const ocupacao     = mesa.queueEntries[0] ?? null
              const isOcupada    = mesa.status === 'OCUPADA'
              const isRedonda    = mesa.forma === 'redonda'
              const isSelMesa    = selectedMesaId  === mesa.id
              const isSelGrupo   = selectedGrupoId === grupoId && !!grupoId
              const isJuntarSel  = selecionadas.has(mesa.id)
              const isDimmed     = modoJuntar && (isOcupada || emGrupo)
              const minutosOc    = ocupacao?.calledAt
                ? Math.floor((Date.now() - new Date(ocupacao.calledAt).getTime()) / 60000)
                : null

              // Cores
              let border = emGrupo ? 'border-amber-400' : isOcupada ? 'border-red-400' : 'border-green-400'
              let bg     = emGrupo ? 'bg-amber-50'  : isOcupada ? 'bg-red-50'  : 'bg-green-50'
              let layer  = emGrupo ? 'bg-amber-300' : isOcupada ? 'bg-red-400' : 'bg-green-400'
              let textColor = emGrupo ? 'text-amber-700' : isOcupada ? 'text-red-700' : 'text-green-700'

              if (isJuntarSel) { border = 'border-blue-600'; bg = 'bg-blue-50'; layer = 'bg-blue-400'; textColor = 'text-blue-700' }
              if ((isSelMesa || isSelGrupo) && !isJuntarSel) { border = 'border-blue-500' }

              const hasRing = isSelMesa || isSelGrupo || isJuntarSel

              return (
                <div
                  key={mesa.id}
                  onClick={() => handleMesaClick(mesa.id)}
                  className={[
                    'absolute border-2 flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-150',
                    border, bg,
                    isRedonda ? 'rounded-full' : 'rounded-xl',
                    isDimmed ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer hover:shadow-md',
                    emGrupo && !isSelGrupo ? 'border-dashed' : 'border-solid',
                    hasRing ? 'ring-2 ring-blue-400 ring-offset-1 shadow-lg' : '',
                  ].join(' ')}
                  style={{
                    left:   mesa.posX * CELL + 3,
                    top:    mesa.posY * CELL + 3,
                    width:  mesa.largura * CELL - 6,
                    height: mesa.altura * CELL - 6,
                    zIndex: hasRing ? 10 : 1,
                  }}
                >
                  {/* Layer de cor */}
                  <div className={`absolute inset-0 ${isRedonda ? 'rounded-full' : 'rounded-xl'} opacity-30 ${layer}`} />

                  {/* Badge de grupo */}
                  {emGrupo && (
                    <div className="absolute top-1 left-1 bg-amber-500 text-white text-[8px] font-bold px-1 py-0.5 rounded leading-none">
                      G
                    </div>
                  )}

                  {/* Check de seleção (modo juntar) */}
                  {isJuntarSel && (
                    <div className="absolute top-1 right-1">
                      <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                  )}

                  {/* Conteúdo */}
                  <div className="relative flex flex-col items-center justify-center gap-0.5 px-1 text-center">
                    <span className={`font-black leading-none ${textColor}`}
                      style={{ fontSize: mesa.largura >= 2 ? '1.5rem' : '1.1rem' }}>
                      {mesa.numero}
                    </span>

                    {/* Info de ocupação (mesas largas e não agrupadas) */}
                    {ocupacao && !emGrupo && mesa.largura >= 2 && (
                      <>
                        <span className="text-[9px] font-semibold text-red-600 truncate max-w-full px-1 leading-tight">
                          {ocupacao.guestName.split(' ')[0]}
                        </span>
                        <span className="text-[9px] text-red-500 flex items-center gap-0.5">
                          <Users className="w-2.5 h-2.5" />{ocupacao.partySize}
                          {minutosOc !== null && <span className="ml-1 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{minutosOc}m</span>}
                        </span>
                      </>
                    )}

                    {/* Capacidade (mesas livres não agrupadas) */}
                    {!isOcupada && !emGrupo && (
                      <span className="text-[9px] text-green-600 font-medium">{mesa.capacidade}px</span>
                    )}

                    {/* Label de grupo */}
                    {emGrupo && mesa.largura >= 2 && (
                      <span className="text-[9px] text-amber-600 font-semibold">grupo</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legenda */}
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
            <span>Clique → detalhes</span>
            {!modoJuntar && <span className="text-amber-500">Borda tracejada = mesa em grupo · clique para ver o grupo</span>}
            {modoJuntar && <span className="text-blue-500">Clique nas mesas LIVRE para selecionar · mesas dimmed não podem ser agrupadas</span>}
          </div>
        </div>

        {/* Painéis laterais (modo normal) */}
        {!modoJuntar && selectedMesa && !mesaParaGrupo.has(selectedMesa.id) && (
          <MesaDetailPanel
            mesa={selectedMesa}
            isLiberando={liberandoId === selectedMesa.id && isPending}
            onLiberar={() => handleLiberar(selectedMesa.id)}
            onClose={() => setSelectedMesaId(null)}
          />
        )}
        {!modoJuntar && selectedGrupo && (
          <GrupoDetailPanel
            grupo={selectedGrupo}
            mesas={mesas}
            isDissolvendo={dissolvendoId === selectedGrupo.id && isPending}
            onDissolver={() => handleDissolver(selectedGrupo.id)}
            onClose={() => setSelectedGrupoId(null)}
          />
        )}
      </div>

      {/* Barra flutuante do modo juntar */}
      {modoJuntar && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-white border-2 border-blue-200 rounded-2xl shadow-xl shadow-blue-100">
          <div className="text-sm text-slate-700">
            {selecionadas.size === 0 && <span className="text-slate-400">Selecione as mesas no mapa acima</span>}
            {selecionadas.size === 1 && <span><strong>1</strong> mesa selecionada · <strong>{capacidadeSelecionada}</strong> lugar · selecione mais 1+</span>}
            {selecionadas.size >= 2 && (
              <span>
                <strong>{selecionadas.size}</strong> mesas · <strong>{capacidadeSelecionada}</strong> lugares no total
              </span>
            )}
          </div>
          {erroJuntar && <span className="text-xs text-red-600">{erroJuntar}</span>}
          <button
            onClick={handleJuntar}
            disabled={selecionadas.size < 2 || (juntando && isPending)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {juntando && isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            Juntar
          </button>
          <button
            onClick={cancelarJuntar}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Painel: Mesa Individual ──────────────────────────────────────────────────

type MesaPanelProps = {
  mesa: MesaOp
  isLiberando: boolean
  onLiberar: () => void
  onClose: () => void
}

function MesaDetailPanel({ mesa, isLiberando, onLiberar, onClose }: MesaPanelProps) {
  const [confirming, setConfirming] = useState(false)
  const ocupacao = mesa.queueEntries[0] ?? null
  const isOcupada = mesa.status === 'OCUPADA'
  const minutos = ocupacao?.calledAt
    ? Math.floor((Date.now() - new Date(ocupacao.calledAt).getTime()) / 60000)
    : null

  return (
    <div className={`w-64 flex-shrink-0 rounded-xl border-2 p-4 space-y-4 ${
      isOcupada ? 'border-red-200 bg-red-50/50' : 'border-green-200 bg-green-50/50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
            isOcupada ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>{mesa.numero}</div>
          <div>
            <p className="text-sm font-bold text-slate-800">Mesa {mesa.numero}</p>
            <p className="text-xs text-slate-400">{mesa.capacidade} lugares · {mesa.forma}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
      </div>

      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isOcupada ? 'bg-red-100' : 'bg-green-100'}`}>
        {isOcupada
          ? <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          : <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
        <span className={`text-sm font-semibold ${isOcupada ? 'text-red-700' : 'text-green-700'}`}>
          {isOcupada ? 'Ocupada' : 'Livre'}
        </span>
      </div>

      {ocupacao && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span><strong>{ocupacao.guestName}</strong> · {ocupacao.partySize} {ocupacao.partySize === 1 ? 'pessoa' : 'pessoas'}</span>
          </div>
          {minutos !== null && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>Há {minutos} {minutos === 1 ? 'minuto' : 'minutos'}</span>
            </div>
          )}
          <p className="text-xs text-slate-400">{ocupacao.status === 'CALLED' ? 'Chamado' : 'Sentado'}</p>
        </div>
      )}

      {isOcupada && (
        <div className="pt-1">
          {!confirming ? (
            <button onClick={() => setConfirming(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors">
              <CheckCircle className="w-4 h-4" />Liberar Mesa
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-600 font-medium">Confirmar liberação da Mesa {mesa.numero}?</p>
              <div className="flex gap-2">
                <button onClick={onLiberar} disabled={isLiberando}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold disabled:opacity-50">
                  {isLiberando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Confirmar
                </button>
                <button onClick={() => setConfirming(false)}
                  className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {!isOcupada && (
        <p className="text-xs text-slate-400 text-center">Mesa disponível para receber clientes</p>
      )}
    </div>
  )
}

// ─── Painel: Grupo ────────────────────────────────────────────────────────────

type GrupoPanelProps = {
  grupo: GrupoOp
  mesas: MesaOp[]
  isDissolvendo: boolean
  onDissolver: () => void
  onClose: () => void
}

function GrupoDetailPanel({ grupo, mesas, isDissolvendo, onDissolver, onClose }: GrupoPanelProps) {
  const [confirming, setConfirming] = useState(false)
  const mesasDoGrupo = mesas.filter((m) => grupo.mesas.some((gi) => gi.mesaId === m.id))
  const ocupacao = grupo.queueEntries[0] ?? null

  return (
    <div className="w-64 flex-shrink-0 rounded-xl border-2 border-amber-300 bg-amber-50/50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Grupo de Mesas</p>
            <p className="text-xs text-slate-400">{grupo.capacidade} lugares no total</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
      </div>

      {/* Mesas do grupo */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-slate-600">Mesas agrupadas</p>
        <div className="flex flex-wrap gap-2">
          {mesasDoGrupo.map((m) => (
            <div key={m.id}
              className="flex items-center gap-1 px-2 py-1 bg-amber-100 border border-amber-300 rounded-lg text-xs font-bold text-amber-800">
              <span>{m.numero}</span>
              <span className="text-amber-500 font-normal">· {m.capacidade}px</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-amber-600 font-medium">
          Total: {grupo.capacidade} lugares
          {mesasDoGrupo.length > 0 && ` (${mesasDoGrupo.map((m) => m.numero).join(' + ')})`}
        </p>
      </div>

      {/* Ocupação do grupo */}
      {ocupacao ? (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-1">
          <p className="text-xs font-semibold text-red-700">Grupo ocupado</p>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Users className="w-4 h-4 text-slate-400" />
            <span><strong>{ocupacao.guestName}</strong> · {ocupacao.partySize} pessoas</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-100">
          <CheckCircle className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-700">Grupo disponível</span>
        </div>
      )}

      {/* Dissolver */}
      <div className="pt-1">
        {!confirming ? (
          <button onClick={() => setConfirming(true)}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold transition-colors">
            <Link2Off className="w-4 h-4" />
            Dissolver Grupo
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-slate-600 font-medium">Dissolver o grupo e liberar as mesas individualmente?</p>
            <div className="flex gap-2">
              <button onClick={onDissolver} disabled={isDissolvendo}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50">
                {isDissolvendo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2Off className="w-3.5 h-3.5" />}
                Dissolver
              </button>
              <button onClick={() => setConfirming(false)}
                className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
