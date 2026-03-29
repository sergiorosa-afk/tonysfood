import { cn } from '@/lib/utils'

interface Column<T> {
  key: keyof T | string
  label: string
  render?: (value: any, row: T) => React.ReactNode
  className?: string
}

interface RecentTableProps<T extends Record<string, any>> {
  title: string
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
  className?: string
}

export function RecentTable<T extends Record<string, any>>({
  title,
  columns,
  data,
  emptyMessage = 'Nenhum registro encontrado',
  className,
}: RecentTableProps<T>) {
  return (
    <div className={cn('bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden', className)}>
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <p className="text-sm text-slate-400">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={cn(
                      'px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider',
                      col.className
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={cn('px-5 py-3.5 text-sm text-slate-700', col.className)}
                    >
                      {col.render
                        ? col.render(row[col.key as keyof T], row)
                        : String(row[col.key as keyof T] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
