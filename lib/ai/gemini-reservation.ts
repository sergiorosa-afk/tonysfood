/**
 * Gemini REST API integration for WhatsApp reservation flow.
 * Uses fetch directly — no extra package needed.
 */

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

const SYSTEM_PROMPT = `Você é o assistente virtual de reservas do restaurante Tony's Food.
Seu ÚNICO objetivo é coletar as informações necessárias para fazer uma reserva de mesa e confirmá-la com o cliente.

Dados obrigatórios para a reserva:
- Nome completo do cliente
- Data da reserva (converta qualquer formato para YYYY-MM-DD)
- Horário desejado (converta para HH:MM, formato 24h)
- Número de pessoas

Observações são opcionais — pergunte ao final se o cliente tem alguma necessidade especial.

Instruções:
1. Seja cordial, breve e em português brasileiro
2. Colete os dados de forma natural, sem bombardear com várias perguntas de uma vez
3. Se o cliente já informou algum dado na primeira mensagem, use-o e não pergunte novamente
4. Quando tiver todos os dados obrigatórios, mostre um resumo claro e peça confirmação
5. Só defina readyToBook=true APÓS o cliente confirmar o resumo (ex: "sim", "pode", "confirma", "ok")
6. Se o cliente não quiser fazer reserva ou quiser cancelar, defina cancelled=true
7. Para assuntos fora de reservas (cardápio, preços, reclamações etc.), diga educadamente que no momento só pode ajudar com reservas
8. Quando readyToBook=true, o reply deve ser a mensagem final de confirmação da reserva criada

SEMPRE responda com JSON válido neste formato exato, sem nenhum texto fora do JSON:
{
  "reply": "sua mensagem ao cliente aqui",
  "collected": {
    "name": null,
    "date": null,
    "time": null,
    "partySize": null,
    "notes": null
  },
  "readyToBook": false,
  "cancelled": false
}`

export interface CollectedData {
  name: string | null
  date: string | null      // YYYY-MM-DD
  time: string | null      // HH:MM
  partySize: number | null
  notes: string | null
}

export interface GeminiResult {
  reply: string
  collected: CollectedData
  readyToBook: boolean
  cancelled: boolean
}

export interface HistoryMessage {
  role: 'user' | 'model'
  content: string
}

export async function processWithGemini(
  history: HistoryMessage[],
  currentMessage: string,
  alreadyCollected: CollectedData,
): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada')

  // Build contents array: history + current message
  const contents = [
    ...history.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: currentMessage }] },
  ]

  const systemWithContext =
    SYSTEM_PROMPT +
    `\n\nDados já coletados até agora: ${JSON.stringify(alreadyCollected)}`

  const body = {
    systemInstruction: { parts: [{ text: systemWithContext }] },
    contents,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4,
    },
  }

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  try {
    const parsed = JSON.parse(text) as GeminiResult
    // Ensure collected always has all fields
    parsed.collected = {
      name: parsed.collected?.name ?? null,
      date: parsed.collected?.date ?? null,
      time: parsed.collected?.time ?? null,
      partySize: parsed.collected?.partySize ?? null,
      notes: parsed.collected?.notes ?? null,
    }
    return parsed
  } catch {
    return {
      reply: 'Desculpe, tive uma instabilidade. Pode repetir sua mensagem?',
      collected: alreadyCollected,
      readyToBook: false,
      cancelled: false,
    }
  }
}
