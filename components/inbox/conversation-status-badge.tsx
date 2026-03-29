import { cn } from '@/lib/utils'

const config = {
  OPEN:     { label: 'Aberta',    classes: 'bg-green-50 text-green-700 ring-1 ring-green-200' },
  PENDING:  { label: 'Pendente',  classes: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200' },
  RESOLVED: { label: 'Resolvida', classes: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  CLOSED:   { label: 'Fechada',   classes: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200' },
}

export function ConversationStatusBadge({
  status,
  size = 'sm',
}: {
  status: string
  size?: 'xs' | 'sm'
}) {
  const c = config[status as keyof typeof config] ?? {
    label: status,
    classes: 'bg-slate-100 text-slate-600',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        c.classes
      )}
    >
      {c.label}
    </span>
  )
}
