'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const segmentSchema = z.object({
  name:  z.string().min(1).max(32).regex(/^[A-Z0-9_]+$/, 'Use apenas letras maiúsculas, números e _'),
  label: z.string().min(1).max(64),
  color: z.enum(['amber','blue','green','slate','purple','red','orange','pink','indigo','teal']),
  order: z.coerce.number().default(0),
})

export async function createSegment(_: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  const parsed = segmentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const existing = await prisma.segment.findUnique({ where: { name: parsed.data.name } })
  if (existing) return { error: 'Já existe um segmento com este nome' }

  await prisma.segment.create({ data: parsed.data })
  revalidatePath('/admin/segmentos')
  revalidatePath('/clientes')
  revalidatePath('/catalogo')
  return { success: true }
}

export async function updateSegment(id: string, _: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  const parsed = segmentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await prisma.segment.update({ where: { id }, data: parsed.data })
  revalidatePath('/admin/segmentos')
  revalidatePath('/clientes')
  revalidatePath('/catalogo')
  return { success: true }
}

export async function deleteSegment(id: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }

  const seg = await prisma.segment.findUnique({ where: { id } })
  if (!seg) return { error: 'Segmento não encontrado' }

  // Count customers using this segment
  const count = await prisma.customer.count({ where: { segment: seg.name } })
  if (count > 0) return { error: `Este segmento está em uso por ${count} cliente(s). Reatribua-os antes de excluir.` }

  await prisma.segment.delete({ where: { id } })
  revalidatePath('/admin/segmentos')
  revalidatePath('/clientes')
  revalidatePath('/catalogo')
  return { success: true }
}
