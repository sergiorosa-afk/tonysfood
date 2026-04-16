# Contexto Tony's Food App — Nova Sessão

> Cole este documento no início de qualquer nova conversa para evitar retrabalho.

---

## 1. Perfil do Projeto

**App:** Tony's Food — sistema de gestão para restaurante
**Stack:** Next.js 14 App Router · Prisma · MySQL (Hostgator, `connection_limit=2`) · Tailwind CSS
**Deploy:** Railway (UTC) · domínio `tonysfood.targetup.com.br`
**Auth:** NextAuth.js — sessão tem `session.user.unitId`
**Dev:** Sergio Santos

---

## 2. Regras Arquiteturais Críticas (NÃO VIOLAR)

| Regra | Motivo |
|---|---|
| Layouts do App Router **não recebem `searchParams`** | Next.js 14 — somente Pages recebem |
| **Não usar SDK do Gemini** — usar `fetch` direto | Sem package extra; REST API funciona |
| **Railway roda em UTC, Brasil é UTC-3** | Sem DST desde 2019; datas sempre converter |
| Prisma JSON write → `function toJson(v) { return v as any }` | Evita erro `InputJsonValue` |
| Prisma JSON read → `as unknown as MinhaInterface[]` | Evita erro de conversão TypeScript |
| Worker WhatsApp é child process separado do Next.js | Comunicação via IPC, não HTTP |
| MySQL `connection_limit=2` | Não abrir múltiplas transações longas simultâneas |

---

## 3. Módulos Implementados

### 3.1 WhatsApp Web (Baileys)

**Arquitetura:** Next.js (service.ts) ↔ IPC ↔ worker.js (Baileys)

**Fluxo de mensagem recebida:**
1. `worker.js` recebe mensagem via `sock.ev.on('messages.upsert')`
2. Resolve JID: se `@lid` → busca no `lidToPhone` map ou `sock.contacts`; passa `remoteJid` original
3. `saveInboundMessage(fromPhone, text)` — salva no Inbox (Conversation/Message)
4. `handleAiResponse(fromPhone, remoteJid, text)` — fire-and-forget IPC para o pai
5. `service.ts` recebe `{action:'ai-process'}`, chama `processAiMessage()`, envia `{action:'ai-reply'}` de volta
6. `worker.js` recebe `ai-reply`, envia pelo WhatsApp usando `remoteJid` original, depois `saveOutboundMessage()`

**Atenção @lid:** SEMPRE passar o `remoteJid` original pela cadeia IPC. Nunca reconstruir JID a partir de phone quando já tem `remoteJid`.

**Arquivos:**
- `lib/whatsapp-web/worker.js` — child process Baileys
- `lib/whatsapp-web/service.ts` — spawn/kill worker, IPC handler

---

### 3.2 IA de Reservas (Gemini)

**Modelo:** `gemini-2.5-flash` (gemini-1.5-flash e 2.0-flash estão descontinuados)
**API Key:** env var `GEMINI_API_KEY`
**URL:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`

**Arquivos:**
- `lib/ai/gemini-reservation.ts` — chamada REST ao Gemini
- `lib/ai/process-ai-message.ts` — orquestração sessão + reserva
- `app/api/whatsapp/ai-test/route.ts` — endpoint de debug (GET `?msg=...` ou `?action=list`)

**Fluxo da IA:**
1. Busca `AiConversation` ACTIVE para o phone/unitId
2. Se expirada (> 30min) → marca EXPIRED, cria nova
3. Chama `processWithGemini(history, message, collected)` → retorna JSON `{reply, collected, readyToBook, cancelled}`
4. Se `readyToBook=true`: cria Customer (se não existe) + Reservation (channel: 'WHATSAPP') + ReservationStatusHistory (não-crítico, `.catch()`)
5. Atualiza sessão em bloco `try/catch` separado (falha aqui não cancela o reply)
6. Retorna `reply` para o worker enviar via WhatsApp

**Modelo Prisma:**
```prisma
model AiConversation {
  id        String   @id @default(cuid())
  unitId    String
  phone     String
  status    String   @default("ACTIVE") // ACTIVE, COMPLETED, EXPIRED
  history   Json                         // [{role:"user"|"model", content:string}]
  collected Json                         // {name, date, time, partySize, notes}
  expiresAt DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([unitId, phone])
  @@map("ai_conversations")
}
```

**System Prompt:** coleta name/date(YYYY-MM-DD)/time(HH:MM)/partySize/notes; só seta `readyToBook=true` APÓS confirmação explícita do cliente; resposta sempre JSON puro.

---

### 3.3 Inbox (Conversas WhatsApp)

**Arquivos:**
- `lib/queries/inbox.ts` — queries Prisma
- `lib/actions/inbox-actions.ts` — server action `fetchInboxData(status?, q?)`
- `components/inbox/conversation-list.tsx` — client component (`'use client'`)
- `app/(dashboard)/inbox/layout.tsx` — layout simples sem auth própria

**Ordenação:** OPEN (0) → PENDING (1) → outros (2); dentro de cada grupo por `lastMessageAt desc`
**Filtros:** tabs de status + busca por nome/telefone
**Auto-refresh:** a cada 15 segundos via `setInterval`
**Active conversation:** derivado de `usePathname()` → `/inbox/[id]`

**Por que client component?** App Router layouts não recebem searchParams → ConversationList usa `useSearchParams()` para ler filtros da URL.

---

### 3.4 Reservas — Filtro de Data

**Problema resolvido:** Datas são salvas como UTC puro pelo Railway. Filtro usa `Date.UTC()` para meia-noite exata de cada dia — sem deslocamento de fuso.

**Fix em `lib/queries/reservations.ts`:**
```typescript
function getDateRange(date: ReservationFilters['date']) {
  const now = new Date()
  const y = now.getUTCFullYear(), m = now.getUTCMonth(), d = now.getUTCDate()
  if (date === 'today')    return { gte: new Date(Date.UTC(y,m,d)),   lt: new Date(Date.UTC(y,m,d+1)) }
  if (date === 'tomorrow') return { gte: new Date(Date.UTC(y,m,d+1)), lt: new Date(Date.UTC(y,m,d+2)) }
  if (date === 'week')     return { gte: new Date(Date.UTC(y,m,d)),   lt: new Date(Date.UTC(y,m,d+7)) }
  return undefined
}
```

### 3.5 IA — Ano na data da reserva

**Problema resolvido:** Gemini retornava data sem ano (ex: `"04-03"`) ou com ano errado.

**Fix em `lib/ai/gemini-reservation.ts`:** passa `Data de hoje: YYYY-MM-DD (ano atual: YYYY)` no `systemWithContext`.

**Fix em `lib/ai/process-ai-message.ts`:** validação defensiva ao parsear a data coletada:
```typescript
const parts = date.split('-').map(Number)
const currentYear = new Date().getUTCFullYear()
const [year, month, day] = parts.length === 3
  ? [parts[0] < currentYear ? currentYear : parts[0], parts[1], parts[2]]
  : [currentYear, parts[0], parts[1]]
const reservationDate = new Date(Date.UTC(year, month - 1, day, hour, minute))
```

### 3.6 Notificação WhatsApp ao Confirmar Reserva

**Arquivos:** `lib/actions/reservations.ts`

**Gatilhos:**
- `confirmReservation(id)` — staff confirma reserva PENDING
- `createReservation()` — reserva criada diretamente como CONFIRMED

**Comportamento:** só envia se WhatsApp estiver `connected` e houver `guestPhone`. Falha é silenciosa (não afeta a confirmação).

**Mensagem enviada:**
```
Olá, *João*! ✅

Sua reserva no *Tony's Food* foi confirmada:

📅 *03/04/2026* às *19:00*
👥 *4 pessoas*
📝 observação (se houver)

Aguardamos você! 🍽️
```

### 3.7 Módulo de Bloqueios de Reserva

**Tela:** `/bloqueios` (listagem) e `/bloqueios/novo` (formulário)
**Sidebar:** item "Bloqueios" na seção Sistema
**Admin:** card "Bloqueios de Reserva" na grade de configurações

**Modelo Prisma:**
```prisma
model ReservationBlock {
  id        String    @id @default(cuid())
  unitId    String
  label     String?
  allDay    Boolean   @default(false)
  period    String?   // 'morning'|'lunch'|'afternoon'|'evening'
  startTime String?   // HH:MM
  endTime   String?   // HH:MM
  date      DateTime?
  weekDay   Int?      // 0=Dom..6=Sáb
  frequency String    @default("once") // 'once'|'daily'|'weekly'|'biweekly'|'monthly'
  active    Boolean   @default(true)
  @@map("reservation_blocks")
}
```

**Períodos:**
| Chave | Faixa |
|---|---|
| `morning` | 06h–12h |
| `lunch` | 12h–15h |
| `afternoon` | 12h–18h |
| `evening` | 18h–24h |

**Arquivos:**
- `lib/queries/blocks.ts` — `getBlocks()` + `isDateTimeBlocked(unitId, dateStr, timeStr)`
- `lib/actions/blocks.ts` — `createBlock()`, `deleteBlock()`, `toggleBlock()`
- `components/blocks/block-form.tsx` — formulário (usa `useFormState` do react-dom)
- `components/blocks/block-actions.tsx` — ativar/desativar/excluir

**Integração com IA:** em `process-ai-message.ts`, antes de criar a reserva, `isDateTimeBlocked()` é chamado. Se bloqueado, retorna mensagem ao cliente e mantém sessão ativa para ele tentar outro horário.

**ATENÇÃO — padrão de formulários:** projeto usa React 18 + Next.js 14. Usar sempre `useFormState` do `react-dom` (NÃO `useActionState` do React — esse é React 19+).

---

## 4. Código Completo dos Arquivos Principais

### `lib/ai/gemini-reservation.ts`
```typescript
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

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
  date: string | null
  time: string | null
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

  const contents = [
    ...history.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
    { role: 'user', parts: [{ text: currentMessage }] },
  ]

  const systemWithContext =
    SYSTEM_PROMPT + `\n\nDados já coletados até agora: ${JSON.stringify(alreadyCollected)}`

  const body = {
    systemInstruction: { parts: [{ text: systemWithContext }] },
    contents,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
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
```

---

### `lib/ai/process-ai-message.ts`
```typescript
import { prisma } from '@/lib/db'
import { processWithGemini, CollectedData, HistoryMessage } from './gemini-reservation'
import { normalizePhone, phoneVariants } from '@/lib/utils/phone'

const SESSION_TIMEOUT_MS = 30 * 60 * 1000

function toJson(v: unknown) { return v as any }

export async function processAiMessage(
  unitId: string,
  phone: string,
  message: string,
): Promise<string | null> {
  try {
    const normalizedPhone = normalizePhone(phone)
    const variants = phoneVariants(phone)

    let aiConv = await prisma.aiConversation.findFirst({
      where: { unitId, phone: { in: variants }, status: 'ACTIVE' },
      orderBy: { updatedAt: 'desc' },
    })

    if (aiConv && new Date() > aiConv.expiresAt) {
      await prisma.aiConversation.update({ where: { id: aiConv.id }, data: { status: 'EXPIRED' } })
      aiConv = null
    }

    const emptyCollected: CollectedData = { name: null, date: null, time: null, partySize: null, notes: null }

    if (!aiConv) {
      aiConv = await prisma.aiConversation.create({
        data: {
          unitId,
          phone: normalizedPhone,
          status: 'ACTIVE',
          history: toJson([]),
          collected: toJson(emptyCollected),
          expiresAt: new Date(Date.now() + SESSION_TIMEOUT_MS),
        },
      })
    }

    const history = aiConv.history as unknown as HistoryMessage[]
    const collected = aiConv.collected as unknown as CollectedData
    const gemini = await processWithGemini(history, message, collected)

    const newHistory: HistoryMessage[] = [
      ...history,
      { role: 'user', content: message },
      { role: 'model', content: gemini.reply },
    ]

    let finalReply = gemini.reply

    if (gemini.cancelled) {
      await prisma.aiConversation.update({
        where: { id: aiConv.id },
        data: { status: 'EXPIRED', history: toJson(newHistory), collected: toJson(gemini.collected) },
      })
    } else if (gemini.readyToBook) {
      const { name, date, time, partySize, notes } = gemini.collected

      if (name && date && time && partySize) {
        let reservationCreated = false

        try {
          const [year, month, day] = date.split('-').map(Number)
          const [hour, minute] = time.split(':').map(Number)
          const reservationDate = new Date(year, month - 1, day, hour, minute)

          let customer = await prisma.customer.findFirst({ where: { unitId, phone: { in: variants } } })
          if (!customer) {
            customer = await prisma.customer.create({
              data: { unitId, name, phone: normalizedPhone, segment: 'NEW' },
            })
          }

          const reservation = await prisma.reservation.create({
            data: {
              unitId,
              customerId: customer.id,
              guestName: name,
              guestPhone: normalizedPhone,
              date: reservationDate,
              partySize,
              status: 'PENDING',
              channel: 'WHATSAPP',
              notes: notes ?? null,
            },
          })
          reservationCreated = true

          prisma.reservationStatusHistory.create({
            data: {
              reservationId: reservation.id,
              status: 'PENDING',
              notes: 'Reserva criada pelo assistente virtual via WhatsApp',
            },
          }).catch((e) => console.error('[AI] Erro ao criar statusHistory:', e))
        } catch (err) {
          console.error('[AI] Erro ao criar reserva:', err)
          finalReply = 'Desculpe, ocorreu um problema ao registrar sua reserva. Por favor, tente novamente em instantes.'
        }

        try {
          await prisma.aiConversation.update({
            where: { id: aiConv.id },
            data: {
              status: reservationCreated ? 'COMPLETED' : 'ACTIVE',
              history: toJson(newHistory),
              collected: toJson(gemini.collected),
              expiresAt: reservationCreated ? aiConv.expiresAt : new Date(Date.now() + SESSION_TIMEOUT_MS),
            },
          })
        } catch (err) {
          console.error('[AI] Erro ao atualizar sessão:', err)
        }
      } else {
        try {
          await prisma.aiConversation.update({
            where: { id: aiConv.id },
            data: {
              history: toJson(newHistory),
              collected: toJson(gemini.collected),
              expiresAt: new Date(Date.now() + SESSION_TIMEOUT_MS),
            },
          })
        } catch (err) {
          console.error('[AI] Erro ao manter sessão ativa:', err)
        }
      }
    } else {
      await prisma.aiConversation.update({
        where: { id: aiConv.id },
        data: {
          history: toJson(newHistory),
          collected: toJson(gemini.collected),
          expiresAt: new Date(Date.now() + SESSION_TIMEOUT_MS),
        },
      })
    }

    return finalReply
  } catch (err) {
    console.error('[AI] Erro geral:', err)
    return null
  }
}
```

---

### `lib/whatsapp-web/worker.js` — partes críticas

```javascript
// Handler IPC do processo pai (ordem importa — um único listener)
process.on('message', async (msg) => {
  if (!msg || !msg.action) return

  if (msg.action === 'disconnect') { /* logout + exit */ }

  if (msg.action === 'send' && msg.to && msg.text) {
    const jid = msg.to.includes('@') ? msg.to : `${msg.to.replace(/\D/g, '')}@s.whatsapp.net`
    await currentSock.sendMessage(jid, { text: msg.text })
  }

  // Resposta da IA: usa remoteJid ORIGINAL (nunca reconstruir do phone quando @lid)
  if (msg.action === 'ai-reply' && msg.phone && msg.reply) {
    if (!currentSock) return
    const jid = msg.remoteJid || `${msg.phone.replace(/\D/g, '')}@s.whatsapp.net`
    await currentSock.sendMessage(jid, { text: msg.reply })
    await saveOutboundMessage(msg.phone, msg.reply)
  }
})

// Fire-and-forget — sem Promise, sem timeout
function handleAiResponse(fromPhone, remoteJid, text) {
  try {
    if (!process.send) return
    process.send({ action: 'ai-process', unitId, phone: fromPhone, remoteJid, message: text })
  } catch (err) { /* log */ }
}

// No messages.upsert:
await saveInboundMessage(fromPhone, text)
handleAiResponse(fromPhone, remoteJid, text) // remoteJid = JID original do Baileys
```

---

### `lib/whatsapp-web/service.ts` — IPC handler

```typescript
child.on('message', async (msg: any) => {
  if (!msg || msg.action !== 'ai-process') return
  try {
    const { processAiMessage } = await import('@/lib/ai/process-ai-message')
    const reply = await processAiMessage(msg.unitId, msg.phone, msg.message)
    if (reply) {
      child.send({ action: 'ai-reply', phone: msg.phone, remoteJid: msg.remoteJid, reply })
    }
  } catch (err) {
    console.error('[WaWeb] AI IPC error:', err)
  }
})
```

---

### `lib/queries/inbox.ts`
```typescript
export async function getConversations(filters: InboxFilters = {}) {
  const { unitId, status, q } = filters
  return prisma.conversation.findMany({
    where: {
      ...(unitId ? { unitId } : {}),
      ...(status && status !== 'all' ? { status } : {}),
      ...(q ? { OR: [
        { guestName: { contains: q } },
        { guestPhone: { contains: q } },
        { customer: { name: { contains: q } } },
      ]} : {}),
    },
    include: {
      customer: { select: { id: true, name: true, segment: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
  }).then((convs) => {
    const priority: Record<string, number> = { OPEN: 0, PENDING: 1 }
    return convs.sort((a, b) => {
      const pa = priority[a.status] ?? 2
      const pb = priority[b.status] ?? 2
      if (pa !== pb) return pa - pb
      const ta = new Date(a.lastMessageAt ?? a.createdAt).getTime()
      const tb = new Date(b.lastMessageAt ?? b.createdAt).getTime()
      return tb - ta
    })
  })
}
```

---

### `lib/actions/inbox-actions.ts`
```typescript
'use server'
import { auth } from '@/lib/auth'
import { getConversations, getInboxStats } from '@/lib/queries/inbox'

export async function fetchInboxData(status?: string, q?: string) {
  const session = await auth()
  const unitId = (session?.user as any)?.unitId
  const [conversations, stats] = await Promise.all([
    getConversations({ unitId, status, q }),
    getInboxStats(unitId),
  ])
  return {
    conversations: conversations.map((c) => ({
      id: c.id,
      guestName: c.guestName,
      guestPhone: c.guestPhone,
      status: c.status,
      lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      customer: c.customer ? { name: c.customer.name, segment: c.customer.segment } : null,
      lastMessage: c.messages[0]
        ? { content: c.messages[0].content, direction: c.messages[0].direction }
        : null,
    })),
    stats,
  }
}
```

---

## 5. Erros Conhecidos e Como Resolver

| Erro | Causa | Solução |
|---|---|---|
| `InputJsonValue` TypeScript error | Prisma rejeita tipo concreto para campo JSON | `function toJson(v) { return v as any }` |
| JSON read type error | `JsonArray` não converte direto | `as unknown as MeuTipo[]` |
| Gemini 404 | Modelo descontinuado | Usar `gemini-2.5-flash` |
| IA não responde | Worker usa `process.send` sem esperar | Arquitetura fire-and-forget — normal |
| Mensagem vai para número errado | JID @lid reconstruído incorretamente | Sempre passar `remoteJid` original |
| "Hoje" mostra vazio | Datas salvas UTC puro, filtro usava offset errado | `Date.UTC(y,m,d)` em `getDateRange()` — sem deslocamento |
| Filtros inbox não funcionam | Layout não recebe searchParams | ConversationList é client component com `useSearchParams()` |
| `useActionState` não existe | Projeto é React 18, hook é do React 19 | Usar `useFormState` + `useFormStatus` do `react-dom` |
| Gemini retorna data sem ano | Prompt não passava data atual | Passar `Data de hoje: YYYY-MM-DD` no systemWithContext |

---

## 6. Variáveis de Ambiente (Railway)

```
DATABASE_URL=mysql://...?connection_limit=2
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://tonysfood.targetup.com.br
GEMINI_API_KEY=AIzaSyAPUtbWw_5OZcu1Dx7d9GkDQHt5x_m1D2E
```

---

## 7. Tarefas Pendentes / Melhorias Futuras

- [ ] Remover endpoint de debug `/api/whatsapp/ai-test` quando estável
- [ ] Remover `console.log` de debug do `app/api/whatsapp/ai-message/route.ts`
- [ ] Avaliar se IA deve responder mensagens em grupos (atualmente ignorado por `@g.us`)
- [ ] Adicionar suporte a cancelamento de reserva existente via WhatsApp
- [ ] Exibir contagem de bloqueios ativos no card do admin (requer query no `getAdminStats`)
