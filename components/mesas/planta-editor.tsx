'use client'

import { useState, useTransition, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core'
import { MesaCardEditor, MesaData, CELL } from './mesa-card-editor'
import { AddMesaPanel } from './add-mesa-panel'
import { updatePosicaoMesa, deleteMesa } from '@/lib/actions/mesas'
import { useRouter } from 'next/navigation'
import { Save, Plus, Grid3X3, Info } from 'lucide-react'

const COLS = 14
const ROWS = 10

type Props = {
  initialMesas: MesaData[]
  unitId: string
}

export function PlantaEditor({ initialMesas, unitId }: Props) {
  const router = useRouter()
  const [mesas, setMesas] = useState<MesaData[]>(initialMesas)
  const [selectedMesa, setSelectedMesa] = useState<MesaData | null>(null)
  const [activeDrag, setActiveDrag] = useState<MesaData | null>(null)
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [pendingSaves, setPendingSaves] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  // Snap pixel delta to nearest grid cell
  function snapToGrid(delta: { x: number; y: number }, origin: { posX: number; posY: number }) {
    const newX = Math.round(origin.posX + delta.x / CELL)
    const newY = Math.round(origin.posY + delta.y / CELL)
    return {
      posX: Math.max(0, Math.min(COLS - 1, newX)),
      posY: Math.max(0, Math.min(ROWS - 1, newY)),
    }
  }

  function handleDragStart(event: any) {
    const mesa = mesas.find((m) => m.id === event.active.id)
    if (mesa) setActiveDrag(mesa)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null)
    const { active, delta } = event
    const mesa = mesas.find((m) => m.id === active.id)
    if (!mesa || (delta.x === 0 && delta.y === 0)) return

    const { posX, posY } = snapToGrid(delta, mesa)

    // Otimistic update
    setMesas((prev) =>
      prev.map((m) => (m.id === mesa.id ? { ...m, posX, posY } : m))
    )
    if (selectedMesa?.id === mesa.id) {
      setSelectedMesa((s) => s ? { ...s, posX, posY } : s)
    }

    // Persist
    setPendingSaves((s) => new Set(s).add(mesa.id))
    startTransition(async () => {
      await updatePosicaoMesa(mesa.id, posX, posY, mesa.largura, mesa.altura)
      setPendingSaves((s) => { const n = new Set(s); n.delete(mesa.id); return n })
    })
  }

  function handleMesaAdded(nova: MesaData) {
    setMesas((prev) => [...prev, nova])
    setShowAddPanel(false)
    router.refresh()
  }

  function handleSelect(mesa: MesaData) {
    setSelectedMesa((prev) => prev?.id === mesa.id ? null : mesa)
  }

  function handleDelete(id: string) {
    if (!confirm('Remover esta mesa do salão?')) return
    setDeletingId(id)
    startTransition(async () => {
      await deleteMesa(id)
      setMesas((prev) => prev.filter((m) => m.id !== id))
      if (selectedMesa?.id === id) setSelectedMesa(null)
      setDeletingId(null)
      router.refresh()
    })
  }

  async function handleUpdateSelected(field: keyof MesaData, value: number | string) {
    if (!selectedMesa) return
    const updated = { ...selectedMesa, [field]: value }
    setSelectedMesa(updated)
    setMesas((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))

    setPendingSaves((s) => new Set(s).add(updated.id))
    startTransition(async () => {
      await updatePosicaoMesa(updated.id, updated.posX, updated.posY, updated.largura, updated.altura)
      setPendingSaves((s) => { const n = new Set(s); n.delete(updated.id); return n })
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Grid3X3 className="w-4 h-4" />
          <span>Grid {COLS}×{ROWS} · Arraste as mesas para reposicionar</span>
          {pendingSaves.size > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium">
              <Save className="w-3 h-3 animate-pulse" /> Salvando...
            </span>
          )}
        </div>
        <button
          onClick={() => { setShowAddPanel(true); setSelectedMesa(null) }}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Mesa
        </button>
      </div>

      <div className="flex gap-4 items-start">
        {/* Grid */}
        <div className="flex-1 overflow-x-auto">
          <div
            className="relative bg-slate-50 border-2 border-slate-200 rounded-xl"
            style={{ width: COLS * CELL, height: ROWS * CELL, minWidth: COLS * CELL }}
          >
            {/* Grid lines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
              xmlns="http://www.w3.org/2000/svg"
            >
              {Array.from({ length: COLS + 1 }).map((_, i) => (
                <line
                  key={`v${i}`}
                  x1={i * CELL} y1={0}
                  x2={i * CELL} y2={ROWS * CELL}
                  stroke="#94a3b8" strokeWidth="1"
                />
              ))}
              {Array.from({ length: ROWS + 1 }).map((_, i) => (
                <line
                  key={`h${i}`}
                  x1={0} y1={i * CELL}
                  x2={COLS * CELL} y2={i * CELL}
                  stroke="#94a3b8" strokeWidth="1"
                />
              ))}
            </svg>

            {/* Label de colunas */}
            {Array.from({ length: COLS }).map((_, i) => (
              <span
                key={i}
                className="absolute top-0.5 text-[9px] text-slate-300 font-mono pointer-events-none"
                style={{ left: i * CELL + CELL / 2 - 4 }}
              >
                {i}
              </span>
            ))}

            {/* DnD */}
            <DndContext
              sensors={sensors}
              collisionDetection={pointerWithin}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {mesas.map((mesa) => (
                <MesaCardEditor
                  key={mesa.id}
                  mesa={mesa}
                  selected={selectedMesa?.id === mesa.id}
                  onSelect={handleSelect}
                  onDelete={handleDelete}
                  isDeleting={deletingId === mesa.id}
                />
              ))}

              {/* Drag overlay (ghost) */}
              <DragOverlay dropAnimation={null}>
                {activeDrag && (
                  <div
                    className="bg-blue-200 border-2 border-blue-500 rounded-xl opacity-60 flex items-center justify-center font-black text-blue-700 text-xl"
                    style={{
                      width: activeDrag.largura * CELL - 6,
                      height: activeDrag.altura * CELL - 6,
                    }}
                  >
                    {activeDrag.numero}
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-400 inline-block" /> Livre
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Ocupada
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /> Selecionada
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Info className="w-3 h-3" /> Clique na mesa para editar · Arraste para mover
            </span>
          </div>
        </div>

        {/* Side panel */}
        {(showAddPanel || selectedMesa) && (
          <div className="w-64 flex-shrink-0">
            {showAddPanel && (
              <AddMesaPanel
                unitId={unitId}
                existingNumbers={mesas.map((m) => m.numero)}
                onAdded={handleMesaAdded}
                onClose={() => setShowAddPanel(false)}
              />
            )}

            {selectedMesa && !showAddPanel && (
              <EditMesaPanel
                mesa={selectedMesa}
                onChange={handleUpdateSelected}
                onClose={() => setSelectedMesa(null)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Edit panel inline ────────────────────────────────────────────────────────

type EditProps = {
  mesa: MesaData
  onChange: (field: keyof MesaData, value: number | string) => void
  onClose: () => void
}

function EditMesaPanel({ mesa, onChange, onClose }: EditProps) {
  return (
    <div className="bg-white border border-blue-200 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">Mesa {mesa.numero}</p>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
      </div>

      <div className="space-y-3">
        <Field label="Número">
          <input
            type="number" min={1}
            value={mesa.numero}
            onChange={(e) => onChange('numero', parseInt(e.target.value) || 1)}
            className={input}
          />
        </Field>

        <Field label="Capacidade (lugares)">
          <input
            type="number" min={1} max={20}
            value={mesa.capacidade}
            onChange={(e) => onChange('capacidade', parseInt(e.target.value) || 1)}
            className={input}
          />
        </Field>

        <Field label="Forma">
          <select
            value={mesa.forma}
            onChange={(e) => onChange('forma', e.target.value)}
            className={input}
          >
            <option value="retangular">Retangular</option>
            <option value="redonda">Redonda</option>
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Largura (cel)">
            <input
              type="number" min={1} max={4}
              value={mesa.largura}
              onChange={(e) => onChange('largura', parseInt(e.target.value) || 1)}
              className={input}
            />
          </Field>
          <Field label="Altura (cel)">
            <input
              type="number" min={1} max={4}
              value={mesa.altura}
              onChange={(e) => onChange('altura', parseInt(e.target.value) || 1)}
              className={input}
            />
          </Field>
        </div>

        <div className="pt-1 text-xs text-slate-400 space-y-0.5">
          <p>Posição: coluna {mesa.posX}, linha {mesa.posY}</p>
          <p className="text-slate-300">Arraste a mesa no grid para reposicionar</p>
        </div>
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

const input = 'w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white'
