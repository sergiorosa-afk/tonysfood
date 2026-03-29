import { MessageCircle } from 'lucide-react'

export default function InboxPage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-xs">
        <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-base font-semibold text-slate-700 mb-1">
          Selecione uma conversa
        </h2>
        <p className="text-sm text-slate-400">
          Escolha uma conversa na lista ao lado para visualizar as mensagens e interagir com o cliente.
        </p>
      </div>
    </div>
  )
}
