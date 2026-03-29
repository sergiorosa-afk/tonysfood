'use server'

import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { emitEvent } from '@/lib/events'

const VALID_SEGMENTS = ['VIP', 'REGULAR', 'NEW', 'INACTIVE'] as const

const catalogItemSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  category: z.string().min(1, 'Categoria obrigatória'),
  description: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  tags: z.string().optional(),
  allergens: z.string().optional(),
  active: z.coerce.boolean().optional(),
  featured: z.coerce.boolean().optional(),
  imageUrl: z.string().url('URL inválida').optional().or(z.literal('')),
})

function parseSegments(formData: FormData): string[] {
  const values = formData.getAll('targetSegments') as string[]
  return values.filter((v) => VALID_SEGMENTS.includes(v as any))
}

function parseTags(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

export async function createCatalogItem(_: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  const raw = Object.fromEntries(formData)
  const parsed = catalogItemSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { name, category, description, price, tags, allergens, imageUrl } = parsed.data
  const unitId = (session.user as any).unitId
  const targetSegments = parseSegments(formData)

  const item = await prisma.catalogItem.create({
    data: {
      unitId,
      name,
      category,
      description: description || null,
      price: price ?? null,
      tags: parseTags(tags),
      allergens: parseTags(allergens),
      targetSegments: targetSegments.length > 0 ? targetSegments : Prisma.JsonNull,
      active: true,
      featured: formData.get('featured') === 'true',
      imageUrl: imageUrl || null,
    },
  })

  await emitEvent({
    unitId,
    eventType: 'CATALOG_ITEM_CREATED',
    entityType: 'catalog_item',
    entityId: item.id,
    payload: { name, category },
  })

  revalidatePath('/catalogo')
  return { success: true, id: item.id }
}

export async function updateCatalogItem(id: string, _: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  const raw = Object.fromEntries(formData)
  const parsed = catalogItemSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { name, category, description, price, tags, allergens, imageUrl } = parsed.data
  const targetSegments = parseSegments(formData)

  await prisma.catalogItem.update({
    where: { id },
    data: {
      name,
      category,
      description: description || null,
      price: price ?? null,
      tags: parseTags(tags),
      allergens: parseTags(allergens),
      targetSegments: targetSegments.length > 0 ? targetSegments : Prisma.JsonNull,
      featured: formData.get('featured') === 'true',
      imageUrl: imageUrl || null,
    },
  })

  revalidatePath('/catalogo')
  revalidatePath(`/catalogo/${id}`)
  return { success: true }
}

export async function toggleCatalogItem(id: string, active: boolean) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  await prisma.catalogItem.update({
    where: { id },
    data: { active },
  })

  revalidatePath('/catalogo')
}

export async function toggleFeatured(id: string, featured: boolean) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  await prisma.catalogItem.update({
    where: { id },
    data: { featured },
  })

  revalidatePath('/catalogo')
}

export async function deleteCatalogItem(id: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  const item = await prisma.catalogItem.findUnique({ where: { id } })
  if (!item) return { error: 'Item não encontrado' }

  await prisma.catalogItem.delete({ where: { id } })

  await emitEvent({
    unitId: item.unitId,
    eventType: 'CATALOG_ITEM_DELETED',
    entityType: 'catalog_item',
    entityId: id,
    payload: { name: item.name },
  })

  revalidatePath('/catalogo')
  return { success: true }
}
