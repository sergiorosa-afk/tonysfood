import type { AIProvider, IntentResult, ConversationContext, CustomerData } from './provider'

const INTENT_PATTERNS: { pattern: RegExp; intent: IntentResult['intent']; label: string }[] = [
  { pattern: /reserv|mesa|lugar|book/i,     intent: 'reservation_inquiry', label: 'Consulta de reserva' },
  { pattern: /fila|espera|tempo|wait/i,      intent: 'queue_inquiry',       label: 'Consulta de fila' },
  { pattern: /card[aá]pio|prato|menu|comer|bebid/i, intent: 'menu_inquiry', label: 'Consulta de cardápio' },
  { pattern: /cancel|desist|nao v[aã]o|não vou/i, intent: 'cancellation',  label: 'Cancelamento' },
  { pattern: /confirm|tá bom|ok|certo|anotad/i, intent: 'confirmation',    label: 'Confirmação' },
  { pattern: /reclamaç|ruim|p[eé]ssim|problem|erro/i, intent: 'complaint', label: 'Reclamação' },
  { pattern: /ol[aá]|oi|bom dia|boa tarde|boa noite|hey/i, intent: 'greeting', label: 'Saudação' },
  { pattern: /tchau|até|obrigad|valeu|flw/i, intent: 'farewell',           label: 'Despedida' },
]

const REPLY_TEMPLATES: Record<IntentResult['intent'], string[]> = {
  reservation_inquiry: [
    'Claro! Para qual data e horário você gostaria de reservar?',
    'Ótimo! Quantas pessoas serão na reserva?',
    'Temos disponibilidade! Qual o seu nome para a reserva?',
  ],
  queue_inquiry: [
    'No momento temos {{position}} grupos na fila. Tempo estimado: {{wait}} minutos.',
    'Você pode entrar na nossa fila pelo WhatsApp mesmo! Qual o tamanho do seu grupo?',
    'Posso colocar você na lista de espera agora. Quantas pessoas?',
  ],
  menu_inquiry: [
    'Nosso cardápio tem pratos incríveis! Você prefere carne, frutos do mar ou vegetariano?',
    'Temos opções para todos os gostos. Alguma restrição alimentar?',
    'Posso te enviar nosso cardápio digital. Há alguma preferência especial?',
  ],
  cancellation: [
    'Entendemos! Sua reserva foi cancelada. Esperamos te receber em breve! 😊',
    'Tudo bem! Cancelamos sem problema. Quando quiser voltar, é só chamar!',
    'Feito! Se precisar remarcar depois, estamos à disposição.',
  ],
  confirmation: [
    'Perfeito! Sua reserva está confirmada. Te esperamos! 🎉',
    'Ótimo! Confirmado! Nos vemos em breve.',
    'Confirmado! Qualquer dúvida, é só chamar.',
  ],
  complaint: [
    'Lamentamos muito pela experiência. Pode me contar melhor o que aconteceu?',
    'Obrigado por nos avisar. Vamos resolver isso imediatamente.',
    'Pedimos desculpas. Deixa eu transferir para o responsável cuidar pessoalmente.',
  ],
  greeting: [
    'Olá! Seja bem-vindo(a) ao Tony\'s Food! Em que posso ajudar? 😊',
    'Oi! Tudo bem? Como posso te ajudar hoje?',
    'Olá! Bem-vindo(a)! Reserva, cardápio ou outra dúvida?',
  ],
  farewell: [
    'Foi um prazer! Até a próxima! 🍽️',
    'Obrigado pelo contato! Te esperamos em breve!',
    'Até logo! Qualquer coisa, é só chamar. 😊',
  ],
  other: [
    'Entendi! Posso te ajudar com reservas, cardápio ou fila de espera.',
    'Claro! Um momento, vou verificar para você.',
    'Deixa eu ver isso para você. Um instante!',
  ],
}

const SEGMENT_SUMMARIES: Record<string, string> = {
  VIP: 'Cliente VIP com histórico premium de visitas frequentes e alto engajamento.',
  REGULAR: 'Cliente regular com padrão consistente de visitas.',
  NEW: 'Cliente novo — primeira ou segunda visita registrada.',
  INACTIVE: 'Cliente inativo há algum tempo. Oportunidade de reengajamento.',
}

export class MockProvider implements AIProvider {
  async classifyIntent(message: string): Promise<IntentResult> {
    await delay(120)

    for (const { pattern, intent, label } of INTENT_PATTERNS) {
      if (pattern.test(message)) {
        return { intent, confidence: 0.82 + Math.random() * 0.15, label }
      }
    }
    return { intent: 'other', confidence: 0.5, label: 'Outro' }
  }

  async suggestReplies(ctx: ConversationContext): Promise<string[]> {
    await delay(200)

    const lastMsg = ctx.messages.filter((m) => m.direction === 'INBOUND').slice(-1)[0]
    const intent = lastMsg ? await this.classifyIntent(lastMsg.content) : null

    const templates = REPLY_TEMPLATES[intent?.intent ?? 'other']
    const base = templates.slice(0, 3)

    // Personalise with name if available
    return base.map((t) =>
      ctx.guestName ? t.replace('você', ctx.guestName.split(' ')[0]) : t
    )
  }

  async summarizeCustomer(customer: CustomerData): Promise<string> {
    await delay(150)

    const segText = SEGMENT_SUMMARIES[customer.segment] ?? 'Perfil de cliente.'
    const visitText = customer.visitCount > 0
      ? `Registra ${customer.visitCount} visita${customer.visitCount > 1 ? 's' : ''}.`
      : 'Sem visitas registradas.'
    const lastVisit = customer.lastVisitAt
      ? `Última visita: ${new Date(customer.lastVisitAt).toLocaleDateString('pt-BR')}.`
      : ''
    const prefText = customer.preferences.length > 0
      ? `Preferências: ${customer.preferences.join(', ')}.`
      : ''
    const restText = customer.restrictions.length > 0
      ? `Restrições alimentares: ${customer.restrictions.join(', ')}.`
      : ''
    const noShowText = customer.noShowCount > 0
      ? `⚠️ ${customer.noShowCount} no-show(s) registrado(s).`
      : ''

    return [segText, visitText, lastVisit, prefText, restText, noShowText]
      .filter(Boolean)
      .join(' ')
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
