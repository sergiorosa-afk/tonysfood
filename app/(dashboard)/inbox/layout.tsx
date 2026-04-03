export const dynamic = 'force-dynamic'

import { ConversationList } from '@/components/inbox/conversation-list'

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden -m-6">
      {/* Left: conversation list — fixed width */}
      <div className="w-72 border-r border-slate-200 bg-white flex-shrink-0 overflow-hidden flex flex-col">
        <ConversationList />
      </div>

      {/* Center + Right */}
      <div className="flex-1 overflow-hidden flex">
        {children}
      </div>
    </div>
  )
}
