import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// PUT /api/mesas/:id — atualiza posição, capacidade, forma ou status
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { numero, capacidade, forma, posX, posY, largura, altura, status } = body

  const updateData: Record<string, unknown> = {}
  if (numero    !== undefined) updateData.numero    = numero
  if (capacidade !== undefined) updateData.capacidade = capacidade
  if (forma     !== undefined) updateData.forma     = forma
  if (posX      !== undefined) updateData.posX      = posX
  if (posY      !== undefined) updateData.posY      = posY
  if (largura   !== undefined) updateData.largura   = largura
  if (altura    !== undefined) updateData.altura    = altura
  if (status    !== undefined) updateData.status    = status

  try {
    const mesa = await prisma.mesa.update({
      where: { id: params.id },
      data: updateData,
    })
    return NextResponse.json(mesa)
  } catch {
    return NextResponse.json({ error: 'Mesa não encontrada.' }, { status: 404 })
  }
}

// DELETE /api/mesas/:id — desativa mesa (soft delete)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    await prisma.mesa.update({ where: { id: params.id }, data: { ativo: false } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Mesa não encontrada.' }, { status: 404 })
  }
}
