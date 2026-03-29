import Link from 'next/link'
import { UtensilsCrossed, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 px-4">
      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200">
        <UtensilsCrossed className="w-8 h-8 text-white" />
      </div>

      <div className="text-center">
        <p className="text-7xl font-black text-slate-200 leading-none">404</p>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Página não encontrada</h1>
        <p className="text-slate-500 mt-2 max-w-sm">
          A página que você procura não existe ou foi movida.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao Dashboard
      </Link>
    </div>
  )
}
