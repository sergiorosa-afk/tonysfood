'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const mesaSchema = z.object({
  numero:    z.coerce.number().min(1),
  capacidade: z.coerce.number().min(1).max(20),
  forma:     z.enum(['retangular', 'redonda']).default('retangular'),
  posX:      z.coerce.number().min(0).default(0),
  posY:      z.coerce.number().min(0).default(0),
  largura:   z.coerce.number().min(1).max(4).default(1),
  altura:    z.coerce.number().min(1).max(4).default(1),
  unitId:    z.string().min(1),
})

const updatePosicaoSchema = z.object({
  id:      z.string().min(1),
  posX:    z.coerce.number().min(0),
  posY:    z.coerce.number().min(0),
  largura: z.coerce.number().min(1).max(4),
  altura:  z.coerce.number().min(1).max(4),
})

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export type MesaFormState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
}

export async function createMesa(
  prevState: MesaFormState,
  formData: FormData
): Promise<MesaFormState> {
  const session = await auth()
  if (!session) return { message: 'Não autorizado', success: false }

  const parsed = mesaSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, success: false }
  }

  const { unitId, ...data } = parsed.data

  try {
    await prisma.mesa.create({ data: { ...data, unitId } })
    revalidatePath('/admin/planta')
    revalidatePath('/mesas')
    return { success: true, message: 'Mesa criada com sucesso.' }
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return { errors: { numero: ['Já existe uma mesa com esse número.'] }, success: false }
    }
    return { message: 'Erro ao criar mesa.', success: false }
  }
}

export async function updateMesa(id: string, data: {
  numero?: number
  capacidade?: number
  forma?: string
  posX?: number
  posY?: number
  largura?: number
  altura?: number
}) {
  const session = await auth()
  if (!session) throw new Error('Não autorizado')

  await prisma.mesa.update({ where: { id }, data })
  revalidatePath('/admin/planta')
  revalidatePath('/mesas')
}

export async function updatePosicaoMesa(id: string, posX: number, posY: number, largura = 1, altura = 1) {
  const session = await auth()
  if (!session) throw new Error('Não autorizado')

  await prisma.mesa.update({ where: { id }, data: { posX, posY, largura, altura } })
  revalidatePath('/admin/planta')
}

export async function deleteMesa(id: string) {
  const session = await auth()
  if (!session) throw new Error('Não autorizado')

  await prisma.mesa.update({ where: { id }, data: { ativo: false } })
  revalidatePath('/admin/planta')
  revalidatePath('/mesas')
}

// ─── Status ───────────────────────────────────────────────────────────────────

export async function liberarMesa(mesaId: string) {
  const session = await auth()
  if (!session) throw new Error('Não autorizado')

  await prisma.mesa.update({
    where: { id: mesaId },
    data: { status: 'LIVRE' },
  })

  revalidatePath('/mesas')
  revalidatePath('/fila')
  revalidatePath('/dashboard')
}

// ─── Grupos ───────────────────────────────────────────────────────────────────

export async function criarGrupo(unitId: string, mesaIds: string[]) {
  const session = await auth()
  if (!session) throw new Error('Não autorizado')

  if (mesaIds.length < 2) throw new Error('Um grupo precisa de pelo menos 2 mesas.')

  const mesas = await prisma.mesa.findMany({
    where: { id: { in: mesaIds }, unitId, status: 'LIVRE', ativo: true },
  })

  if (mesas.length !== mesaIds.length) {
    throw new Error('Algumas mesas selecionadas não estão disponíveis.')
  }

  const capacidade = mesas.reduce((sum, m) => sum + m.capacidade, 0)

  const grupo = await prisma.mesaGrupo.create({
    data: {
      unitId,
      capacidade,
      status: 'ATIVO',
      mesas: {
        create: mesaIds.map((mesaId) => ({ mesaId })),
      },
    },
    include: { mesas: { include: { mesa: true } } },
  })

  // Marca as mesas do grupo como OCUPADA
  await prisma.mesa.updateMany({
    where: { id: { in: mesaIds } },
    data: { status: 'OCUPADA' },
  })

  revalidatePath('/mesas')
  revalidatePath('/fila')
  return grupo
}

export async function dissolverGrupo(grupoId: string) {
  const session = await auth()
  if (!session) throw new Error('Não autorizado')

  const grupo = await prisma.mesaGrupo.findUnique({
    where: { id: grupoId },
    include: { mesas: true },
  })
  if (!grupo) throw new Error('Grupo não encontrado.')

  const mesaIds = grupo.mesas.map((gi) => gi.mesaId)

  await prisma.$transaction([
    prisma.mesaGrupo.update({ where: { id: grupoId }, data: { status: 'DISSOLVIDO' } }),
    prisma.mesa.updateMany({ where: { id: { in: mesaIds } }, data: { status: 'LIVRE' } }),
  ])

  revalidatePath('/mesas')
  revalidatePath('/fila')
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

export async function seedMesas(unitId: string): Promise<MesaFormState> {
  const session = await auth()
  if (!session) return { message: 'Não autorizado', success: false }

  const existing = await prisma.mesa.count({ where: { unitId } })
  if (existing > 0) {
    return { message: 'Já existem mesas cadastradas para essa unidade.', success: false }
  }

  // Layout: 3 fileiras de mesas no salão (grid 10×8)
  // Fileira 1: Mesas 1-4 (retangulares 2 lugares, encostadas na parede esquerda)
  // Fileira 2: Mesas 5-8 (retangulares 4 lugares, centro do salão)
  // Fileira 3: Mesas 9-12 (redondas 6 lugares, fundo do salão)
  const layout = [
    // Fileira 1 — mesas para 2 (parede esquerda)
    { numero: 1,  capacidade: 2, forma: 'retangular', posX: 0, posY: 0, largura: 1, altura: 1 },
    { numero: 2,  capacidade: 2, forma: 'retangular', posX: 0, posY: 2, largura: 1, altura: 1 },
    { numero: 3,  capacidade: 2, forma: 'retangular', posX: 0, posY: 4, largura: 1, altura: 1 },
    { numero: 4,  capacidade: 2, forma: 'retangular', posX: 0, posY: 6, largura: 1, altura: 1 },
    // Fileira 2 — mesas para 4 (centro)
    { numero: 5,  capacidade: 4, forma: 'retangular', posX: 3, posY: 0, largura: 2, altura: 1 },
    { numero: 6,  capacidade: 4, forma: 'retangular', posX: 3, posY: 2, largura: 2, altura: 1 },
    { numero: 7,  capacidade: 4, forma: 'retangular', posX: 3, posY: 4, largura: 2, altura: 1 },
    { numero: 8,  capacidade: 4, forma: 'retangular', posX: 3, posY: 6, largura: 2, altura: 1 },
    // Fileira 3 — mesas para 6 (fundo)
    { numero: 9,  capacidade: 6, forma: 'redonda',    posX: 7, posY: 1, largura: 2, altura: 2 },
    { numero: 10, capacidade: 6, forma: 'redonda',    posX: 7, posY: 5, largura: 2, altura: 2 },
  ]

  await prisma.mesa.createMany({
    data: layout.map((m) => ({ ...m, unitId, status: 'LIVRE', ativo: true })),
  })

  revalidatePath('/admin/planta')
  revalidatePath('/mesas')
  return { success: true, message: `${layout.length} mesas criadas com sucesso.` }
}
