// ─── AI Provider abstraction ───────────────────────────────────────────────

export type IntentResult = {
  intent: 'reservation_inquiry' | 'queue_inquiry' | 'menu_inquiry' | 'complaint'
    | 'cancellation' | 'confirmation' | 'greeting' | 'farewell' | 'other'
  confidence: number
  label: string
}

export type ConversationContext = {
  guestName: string | null
  messages: { direction: string; content: string }[]
  customerSegment?: string | null
  preferences?: string[]
  restrictions?: string[]
}

export type CustomerData = {
  name: string
  segment: string
  visitCount: number
  lastVisitAt: Date | null
  tags: string[]
  preferences: string[]
  restrictions: string[]
  reservationCount: number
  noShowCount: number
  openConversations: number
}

export interface AIProvider {
  classifyIntent(message: string): Promise<IntentResult>
  suggestReplies(ctx: ConversationContext): Promise<string[]>
  summarizeCustomer(customer: CustomerData): Promise<string>
}

// ─── Factory — picks Claude if API key is set, otherwise Mock ──────────────

let _provider: AIProvider | null = null

export function getAIProvider(): AIProvider {
  if (_provider) return _provider

  if (process.env.ANTHROPIC_API_KEY) {
    const { ClaudeProvider } = require('./claude-provider')
    _provider = new ClaudeProvider()
  } else {
    const { MockProvider } = require('./mock-provider')
    _provider = new MockProvider()
  }

  return _provider!
}
