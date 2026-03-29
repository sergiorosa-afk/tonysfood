'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

const customerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  notes: z.string().optional(),
  segment: z.string().min(1).default('REGULAR'),
  unitId: z.string().min(1),
})

export type CustomerFormState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
}

export async function createCustomer(
  prevState: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const session = await auth()
  if (!session) return { message: 'Não autorizado', success: false }

  const parsed = customerSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, success: false }
  }

  try {
    await prisma.customer.create({ data: parsed.data })
    revalidatePath('/clientes')
    return { success: true, message: 'Cliente criado com sucesso.' }
  } catch {
    return { message: 'Erro ao criar cliente.', success: false }
  }
}

export async function updateCustomer(
  id: string,
  prevState: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const session = await auth()
  if (!session) return { message: 'Não autorizado', success: false }

  const parsed = customerSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, success: false }
  }

  try {
    await prisma.customer.update({ where: { id }, data: parsed.data })
    revalidatePath('/clientes')
    revalidatePath(`/clientes/${id}`)
    return { success: true, message: 'Cliente atualizado com sucesso.' }
  } catch {
    return { message: 'Erro ao atualizar cliente.', success: false }
  }
}

export async function addCustomerTag(customerId: string, tag: string) {
  const session = await auth()
  if (!session) throw new Error('Não autorizado')
  const clean = tag.trim().toLowerCase()
  if (!clean) return
  try {
    await prisma.customerTag.create({ data: { customerId, tag: clean } })
  } catch { /* tag já existe — ignora */ }
  revalidatePath(`/clientes/${customerId}`)
}

export async function removeCustomerTag(tagId: string, customerId: string) {
  const session = await auth()
  if (!session) throw new Error('Não autorizado')
  await prisma.customerTag.delete({ where: { id: tagId } })
  revalidatePath(`/clientes/${customerId}`)
}

export async function updateCustomerPreferences(
  id: string,
  preferences: string[],
  restrictions: string[]
) {
  const session = await auth()
  if (!session) throw new Error('Não autorizado')
  await prisma.customer.update({
    where: { id },
    data: { preferences, restrictions },
  })
  revalidatePath(`/clientes/${id}`)
}
