export const SEGMENT_COLOR_MAP: Record<string, { badge: string; bg: string; text: string; border: string }> = {
  amber:  { badge: 'bg-amber-100 text-amber-700 border-amber-200',  bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
  blue:   { badge: 'bg-blue-100 text-blue-700 border-blue-200',     bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  green:  { badge: 'bg-green-100 text-green-700 border-green-200',  bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  slate:  { badge: 'bg-slate-100 text-slate-600 border-slate-200',  bg: 'bg-slate-50',  text: 'text-slate-600',  border: 'border-slate-200' },
  purple: { badge: 'bg-purple-100 text-purple-700 border-purple-200', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  red:    { badge: 'bg-red-100 text-red-700 border-red-200',        bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
  orange: { badge: 'bg-orange-100 text-orange-700 border-orange-200', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  pink:   { badge: 'bg-pink-100 text-pink-700 border-pink-200',     bg: 'bg-pink-50',   text: 'text-pink-700',   border: 'border-pink-200' },
  indigo: { badge: 'bg-indigo-100 text-indigo-700 border-indigo-200', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  teal:   { badge: 'bg-teal-100 text-teal-700 border-teal-200',     bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200' },
  gray:   { badge: 'bg-gray-100 text-gray-600 border-gray-200',     bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-200' },
}

export function getSegmentColors(color: string) {
  return SEGMENT_COLOR_MAP[color] ?? SEGMENT_COLOR_MAP['gray']
}
