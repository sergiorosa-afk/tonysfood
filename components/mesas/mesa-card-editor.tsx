'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Pencil } from 'lucide-react'

export const CELL = 72 // px per grid cell

export type MesaData = {
  id: string
  numero: number
  capacidade: number
  forma: string
  status: string
  posX: number
  posY: number
  largura: number
  altura: number
}

type Props = {
  mesa: MesaData
  selected: boolean
  onSelect: (mesa: MesaData) => void
  onDelete: (id: string) => void
  isDeleting: boolean
}

export function MesaCardEditor({ mesa, selected, onSelect, onDelete, isDeleting }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: mesa.id,
    data: { mesa },
  })

  const style = {
    position: 'absolute' as const,
    left: mesa.posX * CELL,
    top: mesa.posY * CELL,
    width: mesa.largura * CELL - 6,
    height: mesa.altura * CELL - 6,
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : selected ? 10 : 1,
    transition: isDragging ? 'none' : 'box-shadow 0.15s',
  }

  const isLivre = mesa.status === 'LIVRE'
  const isRedonda = mesa.forma === 'redonda'

  const bg = isDragging
    ? 'bg-blue-200 border-blue-400'
    : selected
    ? 'bg-blue-50 border-blue-500'
    : isLivre
    ? 'bg-green-50 border-green-400'
    : 'bg-red-50 border-red-400'

  const numColor = isLivre ? 'text-green-700' : 'text-red-700'
  const labelColor = isLivre ? 'text-green-600' : 'text-red-500'

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(mesa)}
      className={`border-2 ${bg} ${isRedonda ? 'rounded-full' : 'rounded-xl'}
        flex flex-col items-center justify-center select-none cursor-pointer
        shadow-sm hover:shadow-md group overflow-hidden`}
    >
      {/* Drag handle */}
      <div
        {...listeners}
        {...attributes}
        className="absolute top-1 left-1 opacity-0 group-hover:opacity-60 cursor-grab active:cursor-grabbing p-0.5 rounded"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-3 h-3 text-slate-500" />
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(mesa.id) }}
        disabled={isDeleting}
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-70 p-0.5 rounded hover:bg-red-100 transition-opacity"
      >
        <Trash2 className="w-3 h-3 text-red-500" />
      </button>

      {/* Edit indicator */}
      {selected && (
        <div className="absolute bottom-1 right-1 p-0.5">
          <Pencil className="w-3 h-3 text-blue-500" />
        </div>
      )}

      {/* Content */}
      <span className={`text-xl font-black ${numColor} leading-none`}>
        {mesa.numero}
      </span>
      <span className={`text-[10px] font-medium ${labelColor} mt-0.5`}>
        {mesa.capacidade}px
      </span>
    </div>
  )
}
