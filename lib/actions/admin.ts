'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// ─── RBAC guard ────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) return { error: 'Não autenticado' }
  if ((session.user as any).role !== 'ADMIN') return { error: 'Permissão negada' }
  return { session }
}

// ─── Users ─────────────────────────────────────────────────────────────────

const userSchema = z.object({
  name:   z.string().min(1, 'Nome obrigatório'),
  email:  z.string().email('E-mail inválido'),
  role:   z.enum(['ADMIN', 'MANAGER', 'HOST', 'ATTENDANT', 'MARKETING', 'AUDITOR']),
  unitId: z.string().optional(),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres').optional(),
})

export async function createUser(_: unknown, formData: FormData) {
  const guard = await requireAdmin()
  if ('error' in guard) return guard

  const raw = Object.fromEntries(formData)
  const parsed = userSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, email, role, unitId, password } = parsed.data
  if (!password) return { error: 'Senha obrigatória para novo usuário' }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'E-mail já cadastrado' }

  const hashed = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name, email, role,
      unitId: unitId || null,
      password: hashed,
      active: true,
    },
  })

  revalidatePath('/admin/usuarios')
  return { success: true, id: user.id }
}

export async function updateUser(id: string, _: unknown, formData: FormData) {
  const guard = await requireAdmin()
  if ('error' in guard) return guard

  const raw = Object.fromEntries(formData)
  const parsed = userSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, email, role, unitId, password } = parsed.data

  const data: Record<string, unknown> = {
    name, email, role,
    unitId: unitId || null,
  }

  if (password && password.length >= 6) {
    data.password = await bcrypt.hash(password, 12)
  }

  await prisma.user.update({ where: { id }, data })

  revalidatePath('/admin/usuarios')
  revalidatePath(`/admin/usuarios/${id}`)
  return { success: true }
}

export async function toggleUser(id: string, active: boolean) {
  const guard = await requireAdmin()
  if ('error' in guard) return

  await prisma.user.update({ where: { id }, data: { active } })
  revalidatePath('/admin/usuarios')
}

export async function deleteUser(id: string) {
  const guard = await requireAdmin()
  if ('error' in guard) return guard

  const session = guard.session
  if ((session.user as any).id === id) return { error: 'Não é possível excluir sua própria conta' }

  await prisma.user.delete({ where: { id } })
  revalidatePath('/admin/usuarios')
  return { success: true }
}

// ─── Units ─────────────────────────────────────────────────────────────────

const unitSchema = z.object({
  name:    z.string().min(1, 'Nome obrigatório'),
  slug:    z.string().min(1, 'Slug obrigatório').regex(/^[a-z0-9-]+$/, 'Slug: apenas letras minúsculas, números e hífens'),
  address: z.string().optional(),
  phone:   z.string().optional(),
})

export async function createUnit(_: unknown, formData: FormData) {
  const guard = await requireAdmin()
  if ('error' in guard) return guard

  const raw = Object.fromEntries(formData)
  const parsed = unitSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, slug, address, phone } = parsed.data

  const existing = await prisma.unit.findUnique({ where: { slug } })
  if (existing) return { error: 'Slug já utilizado' }

  const unit = await prisma.unit.create({
    data: { name, slug, address: address || null, phone: phone || null },
  })

  revalidatePath('/admin/unidades')
  return { success: true, id: unit.id }
}

export async function updateUnit(id: string, _: unknown, formData: FormData) {
  const guard = await requireAdmin()
  if ('error' in guard) return guard

  const raw = Object.fromEntries(formData)
  const parsed = unitSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, slug, address, phone } = parsed.data

  const existing = await prisma.unit.findFirst({ where: { slug, NOT: { id } } })
  if (existing) return { error: 'Slug já utilizado por outra unidade' }

  await prisma.unit.update({
    where: { id },
    data: { name, slug, address: address || null, phone: phone || null },
  })

  revalidatePath('/admin/unidades')
  revalidatePath(`/admin/unidades/${id}`)
  return { success: true }
}

export async function toggleUnit(id: string, active: boolean) {
  const guard = await requireAdmin()
  if ('error' in guard) return

  await prisma.unit.update({ where: { id }, data: { active } })
  revalidatePath('/admin/unidades')
}
