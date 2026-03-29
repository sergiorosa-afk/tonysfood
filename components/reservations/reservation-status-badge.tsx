import { cn } from '@/lib/utils'

const statusConfig = {
  PENDING:    { label: 'Pendente',   classes: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200' },
  CONFIRMED:  { label: 'Confirmada', classes: 'bg-green-50 text-green-700 ring-1 ring-green-200' },
  CANCELLED:  { label: 'Cancelada',  classes: 'bg-red-50 text-red-600 ring-1 ring-red-200' },
  NO_SHOW:    { label: 'No-show',    classes: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200' },
  CHECKED_IN: { label: 'Check-in',   classes: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  COMPLETED:  { label: 'Concluída',  classes: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' },
}

export function ReservationStatusBadge({
  status,
  size = 'sm',
}: {
  status: string
  size?: 'xs' | 'sm'
}) {
  const config = statusConfig[status as keyof typeof statusConfig] ?? {
    label: status,
    classes: 'bg-slate-100 text-slate-600',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        config.classes
      )}
    >
      {config.label}
    </span>
  )
}
