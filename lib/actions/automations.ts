'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ─── Rule actions ──────────────────────────────────────────────────────────

const ruleSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  description: z.string().optional(),
  triggerEvent: z.string().min(1, 'Evento obrigatório'),
  conditionsJson: z.string().optional(),
  actionsJson: z.string().min(2, 'Ao menos uma ação é obrigatória'),
})

export async function createAutomationRule(_: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  const raw = Object.fromEntries(formData)
  const parsed = ruleSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, description, triggerEvent, conditionsJson, actionsJson } = parsed.data

  let conditions = null
  let actions
  try {
    conditions = conditionsJson ? JSON.parse(conditionsJson) : null
    actions = JSON.parse(actionsJson)
  } catch {
    return { error: 'JSON de condições ou ações inválido' }
  }

  const unitId = (session.user as any).unitId
  const rule = await prisma.automationRule.create({
    data: { unitId, name, description: description || null, triggerEvent, conditions, actions },
  })

  revalidatePath('/automacao')
  return { success: true, id: rule.id }
}

export async function updateAutomationRule(id: string, _: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  const raw = Object.fromEntries(formData)
  const parsed = ruleSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, description, triggerEvent, conditionsJson, actionsJson } = parsed.data

  let conditions = null
  let actions
  try {
    conditions = conditionsJson ? JSON.parse(conditionsJson) : null
    actions = JSON.parse(actionsJson)
  } catch {
    return { error: 'JSON de condições ou ações inválido' }
  }

  await prisma.automationRule.update({
    where: { id },
    data: { name, description: description || null, triggerEvent, conditions, actions },
  })

  revalidatePath('/automacao')
  revalidatePath(`/automacao/${id}`)
  return { success: true }
}

export async function toggleAutomationRule(id: string, active: boolean) {
  const session = await auth()
  if (!session?.user) return

  await prisma.automationRule.update({ where: { id }, data: { active } })
  revalidatePath('/automacao')
}

export async function deleteAutomationRule(id: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  await prisma.automationRule.delete({ where: { id } })
  revalidatePath('/automacao')
  return { success: true }
}

// ─── Template actions ──────────────────────────────────────────────────────

const templateSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  category: z.string().min(1, 'Categoria obrigatória'),
  body: z.string().min(1, 'Corpo da mensagem obrigatório'),
  variables: z.string().optional(),
})

export async function createMessageTemplate(_: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  const raw = Object.fromEntries(formData)
  const parsed = templateSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, category, body, variables } = parsed.data
  const unitId = (session.user as any).unitId

  const vars = variables
    ? variables.split(',').map((v) => v.trim()).filter(Boolean)
    : extractVariables(body)

  const template = await prisma.messageTemplate.create({
    data: { unitId, name, category, body, variables: vars },
  })

  revalidatePath('/automacao')
  return { success: true, id: template.id }
}

export async function updateMessageTemplate(id: string, _: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  const raw = Object.fromEntries(formData)
  const parsed = templateSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, category, body, variables } = parsed.data

  const vars = variables
    ? variables.split(',').map((v) => v.trim()).filter(Boolean)
    : extractVariables(body)

  await prisma.messageTemplate.update({
    where: { id },
    data: { name, category, body, variables: vars },
  })

  revalidatePath('/automacao')
  revalidatePath(`/automacao/templates/${id}`)
  return { success: true }
}

export async function toggleMessageTemplate(id: string, active: boolean) {
  const session = await auth()
  if (!session?.user) return

  await prisma.messageTemplate.update({ where: { id }, data: { active } })
  revalidatePath('/automacao')
}

export async function deleteMessageTemplate(id: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  await prisma.messageTemplate.delete({ where: { id } })
  revalidatePath('/automacao')
  return { success: true }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function extractVariables(body: string): string[] {
  const matches = body.match(/\{\{(\w+)\}\}/g) ?? []
  const unique = Array.from(new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, ''))))
  return unique
}
