import { NextRequest, NextResponse } from 'next/server'
import { processWithGemini } from '@/lib/ai/gemini-reservation'

export const dynamic = 'force-dynamic'

/**
 * Endpoint de diagnóstico temporário — testa Gemini sem depender do worker.
 * Uso: GET /api/whatsapp/ai-test?msg=ola+quero+reserva
 * REMOVER após confirmar funcionamento.
 */
export async function GET(req: NextRequest) {
  const msg = req.nextUrl.searchParams.get('msg') ?? 'olá, quero fazer uma reserva'

  try {
    const result = await processWithGemini(
      [],
      msg,
      { name: null, date: null, time: null, partySize: null, notes: null },
    )
    return NextResponse.json({ ok: true, result })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
