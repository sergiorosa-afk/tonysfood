import { getSuggestions } from '@/lib/queries/catalog'
import { formatCurrency } from '@/lib/utils'
import { Tag, AlertTriangle, Sparkles } from 'lucide-react'

export async function SuggestionsPanel({
  preferences,
  restrictions,
  unitId,
}: {
  preferences: string[]
  restrictions: string[]
  unitId?: string
}) {
  if (preferences.length === 0 && restrictions.length === 0) return null

  const suggestions = await getSuggestions(preferences, restrictions, unitId)
  if (suggestions.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-green-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Sugestões do Cardápio</p>
          <p className="text-xs text-slate-500">Baseadas nas preferências do cliente</p>
        </div>
      </div>

      <div className="space-y-2">
        {suggestions.map((item) => {
          const tags = (item.tags as string[]) || []
          const allergens = (item.allergens as string[]) || []
          return (
            <div key={item.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                  {item.price !== null && (
                    <p className="text-sm font-semibold text-green-700 shrink-0">{formatCurrency(item.price)}</p>
                  )}
                </div>
                <p className="text-xs text-slate-500">{item.category}</p>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-green-50 text-green-700">
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {allergens.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {allergens.map((a) => (
                      <span key={a} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-orange-50 text-orange-700">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
