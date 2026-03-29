import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string
  icon: LucideIcon
  description?: string
  color?: 'green' | 'blue' | 'yellow' | 'purple' | 'red' | 'orange'
  trend?: {
    value: number
    label: string
  }
}

const colorMap = {
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-100',
    iconText: 'text-green-600',
    value: 'text-green-700',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100',
    iconText: 'text-blue-600',
    value: 'text-blue-700',
  },
  yellow: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-100',
    iconText: 'text-amber-600',
    value: 'text-amber-700',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-100',
    iconText: 'text-purple-600',
    value: 'text-purple-700',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-100',
    iconText: 'text-red-600',
    value: 'text-red-700',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'bg-orange-100',
    iconText: 'text-orange-600',
    value: 'text-orange-700',
  },
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  color = 'green',
  trend,
}: StatsCardProps) {
  const colors = colorMap[color]

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 truncate">{title}</p>
          <p className={cn('text-3xl font-bold mt-1.5 tabular-nums', colors.value)}>
            {value}
          </p>
          {description && (
            <p className="text-xs text-slate-400 mt-1.5 truncate">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.value >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.value >= 0 ? '+' : ''}
                {trend.value}%
              </span>
              <span className="text-xs text-slate-400">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3', colors.icon)}>
          <Icon className={cn('w-5 h-5', colors.iconText)} />
        </div>
      </div>
    </div>
  )
}
