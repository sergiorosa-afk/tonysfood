import { getSegmentColors } from '@/lib/segment-colors'

type Props = {
  segment: string
  label?: string   // display label from DB
  color?: string   // color key from DB
  size?: 'xs' | 'sm' | 'md'
}

const LEGACY_DEFAULTS: Record<string, { label: string; color: string }> = {
  VIP:      { label: 'VIP',     color: 'amber' },
  REGULAR:  { label: 'Regular', color: 'blue' },
  NEW:      { label: 'Novo',    color: 'green' },
  INACTIVE: { label: 'Inativo', color: 'slate' },
}

export function CustomerSegmentBadge({ segment, label, color, size = 'sm' }: Props) {
  const legacy = LEGACY_DEFAULTS[segment]
  const resolvedLabel = label ?? legacy?.label ?? segment
  const resolvedColor = color ?? legacy?.color ?? 'gray'
  const colors = getSegmentColors(resolvedColor)

  const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'

  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${colors.badge} ${sizeClass}`}>
      {resolvedLabel}
    </span>
  )
}
