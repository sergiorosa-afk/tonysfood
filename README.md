# Tony's Food — Sistema de Gestão

SaaS multi-tenant para gestão de restaurantes. Construído com Next.js 14 App Router, Prisma, MySQL 8 e Tailwind CSS.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript |
| Banco de dados | MySQL 8.0 via Prisma ORM |
| Autenticação | NextAuth.js (credentials) |
| UI | Tailwind CSS + Radix UI |
| IA | Anthropic Claude Haiku (fallback: MockProvider) |
| Mensageria | WhatsApp Business API (Meta) |
| Container | Docker Compose |

## Módulos

| Rota | Descrição |
|------|-----------|
| `/dashboard` | Visão geral com métricas em tempo real |
| `/reservas` | Gestão de reservas (criar, confirmar, cancelar) |
| `/fila` | Fila de espera com estimativa de tempo |
| `/inbox` | Inbox de conversas com sugestões de IA |
| `/clientes` | CRM de clientes com segmentação e tags |
| `/catalogo` | Catálogo de produtos por categoria |
| `/automacao` | Motor de automações, templates de mensagem, logs |
| `/integracoes` | WhatsApp, webhooks outbound com HMAC-SHA256 |
| `/admin` | Gestão de usuários e unidades (ADMIN/MANAGER) |

## Início rápido

### 1. Clonar e instalar

```bash
git clone <repo>
cd tonysfood
npm install
```

### 2. Variáveis de ambiente

```bash
cp .env.example .env
# Edite .env com suas credenciais
```

### 3. Banco de dados

```bash
# Subir MySQL via Docker
docker compose up -d

# Criar schema e seed
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

**Credenciais padrão (seed):** `admin@tonysfood.com` / `admin123`

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | Connection string MySQL |
| `NEXTAUTH_SECRET` | Sim | Chave secreta para JWT |
| `NEXTAUTH_URL` | Sim | URL base da aplicação |
| `ANTHROPIC_API_KEY` | Não | Habilita Claude Haiku; sem ela usa MockProvider |
| `NEXT_PUBLIC_APP_URL` | Não | URL pública (usada em webhooks) |

Credenciais de WhatsApp e segredos de webhook são configurados **por unidade** no banco de dados via `/integracoes`.

## Arquitetura

```
app/
├── (dashboard)/          # Páginas protegidas (layout com sidebar)
│   ├── admin/            # Gestão de usuários e unidades
│   ├── automacao/        # Regras + templates + logs
│   ├── clientes/         # CRM
│   ├── catalogo/         # Catálogo
│   ├── dashboard/        # Overview
│   ├── fila/             # Fila de espera
│   ├── inbox/            # Conversas
│   ├── integracoes/      # WhatsApp + webhooks
│   └── reservas/         # Reservas
├── api/
│   ├── auth/             # NextAuth endpoints
│   ├── health/           # GET /api/health
│   └── webhooks/
│       └── whatsapp/     # Inbound WhatsApp (GET challenge + POST)
lib/
├── actions/              # Server Actions (mutations)
├── ai/                   # AIProvider abstraction (Claude / Mock)
├── engine/               # AutomationEngine
├── events.ts             # emitEvent() — hub central
├── queries/              # Funções de leitura (Prisma)
├── utils/hmac.ts         # HMAC-SHA256 helpers
└── webhooks/dispatcher.ts # Disparo de webhooks outbound
```

### Fluxo de eventos

```
Server Action / API Route
        │
        ▼
   emitEvent(type, payload)
        │
        ├──► SystemEvent salvo no banco
        ├──► AutomationEngine (não-bloqueante)
        └──► WebhookDispatcher (não-bloqueante)
```

### RBAC

| Role | Acesso |
|------|--------|
| ADMIN | Tudo, incluindo gestão de unidades |
| MANAGER | Dashboard + módulos operacionais + admin (sem unidades) |
| HOST | Reservas + Fila |
| ATTENDANT | Inbox + Clientes |
| MARKETING | Catálogo + Automações |
| AUDITOR | Somente leitura |

## Health check

```bash
curl http://localhost:3000/api/health
```

```json
{
  "status": "ok",
  "timestamp": "2026-03-28T...",
  "version": "1.0.0",
  "db": { "status": "connected", "latencyMs": 3 },
  "ai": { "provider": "claude" }
}
```

## Build de produção

```bash
npm run build
npm start
```
