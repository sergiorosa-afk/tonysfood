import { cn } from '@/lib/utils'

const statusConfig = {
  WAITING:     { label: 'Aguardando',  classes: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200' },
  CALLED:      { label: 'Chamado',     classes: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  SEATED:      { label: 'Sentado',     classes: 'bg-green-50 text-green-700 ring-1 ring-green-200' },
  ABANDONED:   { label: 'Desistiu',    classes: 'bg-red-50 text-red-600 ring-1 ring-red-200' },
  TRANSFERRED: { label: 'Transferido', classes: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200' },
}

export function QueueStatusBadge({ status, size = 'sm' }: { status: string; size?: 'xs' | 'sm' }) {
  const config = statusConfig[status as keyof typeof statusConfig] ?? { label: status, classes: 'bg-slate-100 text-slate-600' }
  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium',
      size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
      config.classes
    )}>
      {config.label}
    </span>
  )
}
