'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

export function QueueAutoRefresh({ interval = 30000 }: { interval?: number }) {
  const router = useRouter()
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [countdown, setCountdown] = useState(interval / 1000)

  useEffect(() => {
    const refreshTimer = setInterval(() => {
      router.refresh()
      setLastRefresh(new Date())
      setCountdown(interval / 1000)
    }, interval)

    const countdownTimer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : interval / 1000))
    }, 1000)

    return () => {
      clearInterval(refreshTimer)
      clearInterval(countdownTimer)
    }
  }, [router, interval])

  function handleManualRefresh() {
    router.refresh()
    setLastRefresh(new Date())
    setCountdown(interval / 1000)
  }

  return (
    <button
      onClick={handleManualRefresh}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
      title="Atualizar fila"
    >
      <RefreshCw className="w-3 h-3" />
      <span className="hidden sm:inline">Atualiza em {countdown}s</span>
      <span className="sm:hidden">{countdown}s</span>
    </button>
  )
}
