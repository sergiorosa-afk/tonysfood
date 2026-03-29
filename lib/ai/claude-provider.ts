import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider, IntentResult, ConversationContext, CustomerData } from './provider'

const MODEL = 'claude-haiku-4-5-20251001' // Fast + cheap for assistive features

export class ClaudeProvider implements AIProvider {
  private client: Anthropic

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }

  async classifyIntent(message: string): Promise<IntentResult> {
    const res = await this.client.messages.create({
      model: MODEL,
      max_tokens: 100,
      system: `Você é um classificador de intenções para um sistema de restaurante.
Classifique a mensagem em uma das categorias:
reservation_inquiry, queue_inquiry, menu_inquiry, complaint, cancellation, confirmation, greeting, farewell, other

Responda APENAS com JSON: {"intent": "<categoria>", "confidence": <0-1>, "label": "<label em português>"}`,
      messages: [{ role: 'user', content: message }],
    })

    const text = res.content[0].type === 'text' ? res.content[0].text : '{}'
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(jsonMatch?.[0] ?? '{}')
      return {
        intent: parsed.intent ?? 'other',
        confidence: parsed.confidence ?? 0.7,
        label: parsed.label ?? 'Outro',
      }
    } catch {
      return { intent: 'other', confidence: 0.5, label: 'Outro' }
    }
  }

  async suggestReplies(ctx: ConversationContext): Promise<string[]> {
    const history = ctx.messages
      .slice(-6)
      .map((m) => `${m.direction === 'INBOUND' ? 'Cliente' : 'Atendente'}: ${m.content}`)
      .join('\n')

    const customerCtx = [
      ctx.guestName ? `Nome: ${ctx.guestName}` : '',
      ctx.customerSegment ? `Segmento: ${ctx.customerSegment}` : '',
      ctx.preferences?.length ? `Preferências: ${ctx.preferences.join(', ')}` : '',
      ctx.restrictions?.length ? `Restrições: ${ctx.restrictions.join(', ')}` : '',
    ].filter(Boolean).join(' | ')

    const res = await this.client.messages.create({
      model: MODEL,
      max_tokens: 300,
      system: `Você é um assistente de atendimento de restaurante (Tony's Food).
Sugira 3 respostas curtas, naturais e em português brasileiro para o atendente enviar.
Responda APENAS com JSON: {"suggestions": ["resposta1", "resposta2", "resposta3"]}
Contexto do cliente: ${customerCtx || 'Não disponível'}`,
      messages: [{ role: 'user', content: `Conversa:\n${history}\n\nSugira 3 respostas.` }],
    })

    const text = res.content[0].type === 'text' ? res.content[0].text : '{}'
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(jsonMatch?.[0] ?? '{}')
      return (parsed.suggestions as string[]) ?? []
    } catch {
      return []
    }
  }

  async summarizeCustomer(customer: CustomerData): Promise<string> {
    const profile = JSON.stringify(customer, null, 2)

    const res = await this.client.messages.create({
      model: MODEL,
      max_tokens: 200,
      system: `Você é um assistente de CRM para restaurante.
Crie um resumo conciso (2-3 frases) do perfil do cliente em português, destacando pontos relevantes para o atendimento.
Seja direto e objetivo.`,
      messages: [{ role: 'user', content: `Perfil do cliente:\n${profile}` }],
    })

    return res.content[0].type === 'text' ? res.content[0].text.trim() : ''
  }
}
