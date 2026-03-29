'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { Send, Loader2, Zap } from 'lucide-react'
import { sendMessage } from '@/lib/actions/inbox'

const QUICK_REPLIES = [
  'Olá! Em que posso ajudar?',
  'Sua reserva foi confirmada! 🎉',
  'Sua mesa está pronta, pode vir! 😊',
  'Qual o tamanho do seu grupo?',
  'Qual o horário de preferência?',
  'Agradecemos sua visita!',
]

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [showQuick, setShowQuick] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }, [text])

  function handleSend() {
    if (!text.trim() || isPending) return
    const msg = text
    setText('')
    setError(null)
    startTransition(async () => {
      const result = await sendMessage(conversationId, msg)
      if (result?.error) setError(result.error)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function applyQuickReply(reply: string) {
    setText(reply)
    setShowQuick(false)
    textareaRef.current?.focus()
  }

  return (
    <div className="border-t border-slate-200 bg-white shrink-0">
      {/* Quick replies */}
      {showQuick && (
        <div className="px-4 pt-3 pb-1 flex flex-wrap gap-1.5">
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              onClick={() => applyQuickReply(reply)}
              className="px-3 py-1 rounded-full bg-slate-100 hover:bg-green-100 hover:text-green-700 text-xs text-slate-600 transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="px-4 pt-2 text-xs text-red-600">{error}</div>
      )}

      <div className="flex items-end gap-2 p-3">
        {/* Quick replies toggle */}
        <button
          onClick={() => setShowQuick((v) => !v)}
          title="Respostas rápidas"
          className={`p-2 rounded-lg transition-colors shrink-0 ${
            showQuick ? 'bg-green-100 text-green-600' : 'text-slate-400 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-4 h-4" />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva uma mensagem... (Enter para enviar)"
          rows={1}
          className="flex-1 px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none bg-slate-50 leading-snug"
        />

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || isPending}
          className="p-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  )
}
