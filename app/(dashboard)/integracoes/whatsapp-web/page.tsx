'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Smartphone, CheckCircle, AlertCircle,
  Loader2, RefreshCw, LogOut, Wifi, WifiOff,
} from 'lucide-react'

type Status = 'disconnected' | 'qr' | 'connecting' | 'connected'

interface WaState {
  status: Status
  qr?: string
  phone?: string
  name?: string
  error?: string
}

export default function WhatsAppWebPage() {
  const [state, setState] = useState<WaState>({ status: 'disconnected' })
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp-web/status')
      if (res.ok) setState(await res.json())
    } catch {}
  }, [])

  // Poll while connecting or showing QR
  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    if (state.status === 'qr' || state.status === 'connecting') {
      setPolling(true)
      const id = setInterval(fetchStatus, 2500)
      return () => { clearInterval(id); setPolling(false) }
    }
    setPolling(false)
  }, [state.status, fetchStatus])

  async function handleConnect() {
    setLoading(true)
    try {
      const res = await fetch('/api/whatsapp-web/connect', { method: 'POST' })
      if (res.ok) setState(await res.json())
    } catch {}
    setLoading(false)
  }

  async function handleDisconnect() {
    setLoading(true)
    try {
      const res = await fetch('/api/whatsapp-web/disconnect', { method: 'POST' })
      if (res.ok) setState(await res.json())
    } catch {}
    setLoading(false)
  }

  const statusConfig = {
    disconnected: { label: 'Desconectado', color: 'text-slate-500', Icon: WifiOff, dot: 'bg-slate-300' },
    connecting:   { label: 'Conectando…',  color: 'text-yellow-600', Icon: Loader2, dot: 'bg-yellow-400' },
    qr:           { label: 'Aguardando QR', color: 'text-blue-600',   Icon: Smartphone, dot: 'bg-blue-400' },
    connected:    { label: 'Conectado',     color: 'text-green-600',  Icon: Wifi, dot: 'bg-green-500' },
  }

  const { label, color, Icon, dot } = statusConfig[state.status]

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/integracoes"
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-xl">
            📱
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">WhatsApp Web</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              <span className={`text-xs font-medium ${color}`}>{label}</span>
              {state.status === 'connected' && state.phone && (
                <span className="text-xs text-slate-400">— +{state.phone}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          Uso não-oficial
        </p>
        <p className="text-xs text-amber-700 leading-relaxed">
          Esta integração usa a API não-oficial do WhatsApp Web (biblioteca Baileys). Funciona escaneando o QR Code
          com seu celular, da mesma forma que o WhatsApp Web no navegador. Não requer conta Business API nem aprovação
          da Meta. Indicada para uso interno e volume moderado de mensagens.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-teal-600" />
          Como conectar
        </p>
        <ol className="space-y-2">
          {[
            'Clique em "Iniciar Conexão" abaixo',
            'Aguarde o QR Code aparecer na tela',
            'No seu celular, abra o WhatsApp → Menu → Dispositivos conectados → Conectar dispositivo',
            'Aponte a câmera para o QR Code exibido aqui',
            'Aguarde a confirmação de conexão',
          ].map((step, i) => (
            <li key={i} className="flex gap-2 text-xs text-slate-600">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* QR Code */}
      {state.status === 'qr' && (
        <div className="bg-white rounded-xl border-2 border-dashed border-teal-300 p-6 flex flex-col items-center gap-4">
          <p className="text-sm font-semibold text-slate-700">Escaneie o QR Code com seu WhatsApp</p>
          {state.qr ? (
            <img
              src={state.qr}
              alt="WhatsApp Web QR Code"
              className="w-64 h-64 rounded-xl border border-slate-200 shadow-sm"
            />
          ) : (
            <div className="w-64 h-64 rounded-xl bg-slate-100 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          )}
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            QR Code atualiza automaticamente
          </p>
        </div>
      )}

      {/* Error */}
      {state.error && state.status === 'disconnected' && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Erro ao conectar</p>
            <p className="text-xs text-red-600 mt-0.5">{state.error}</p>
          </div>
        </div>
      )}

      {/* Connecting */}
      {state.status === 'connecting' && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          <p className="text-sm font-medium text-slate-600">Estabelecendo conexão…</p>
          <p className="text-xs text-slate-400">Isso pode levar alguns segundos</p>
        </div>
      )}

      {/* Connected */}
      {state.status === 'connected' && (
        <div className="bg-green-50 rounded-xl border border-green-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-green-800">WhatsApp conectado com sucesso!</p>
            {state.name && <p className="text-sm text-green-700 mt-0.5">{state.name}</p>}
            {state.phone && <p className="text-xs text-green-600 mt-0.5">+{state.phone}</p>}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {state.status === 'disconnected' && (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
            Iniciar Conexão
          </button>
        )}

        {(state.status === 'qr' || state.status === 'connecting') && (
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors disabled:opacity-60"
          >
            Cancelar
          </button>
        )}

        {state.status === 'connected' && (
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Desconectar
          </button>
        )}

        <button
          onClick={fetchStatus}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${polling ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>
    </div>
  )
}
