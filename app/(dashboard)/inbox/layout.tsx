export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { ConversationList } from '@/components/inbox/conversation-list'
import { InboxRefresh } from '@/components/inbox/inbox-refresh'

export default async function InboxLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Record<string, string>
}) {
  const session = await auth()
  const unitId = (session?.user as any)?.unitId

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden -m-6">
      <InboxRefresh intervalMs={15000} />

      {/* Left: conversation list — fixed width */}
      <div className="w-72 border-r border-slate-200 bg-white flex-shrink-0 overflow-hidden flex flex-col">
        <ConversationList unitId={unitId} />
      </div>

      {/* Center + Right */}
      <div className="flex-1 overflow-hidden flex">
        {children}
      </div>
    </div>
  )
}
