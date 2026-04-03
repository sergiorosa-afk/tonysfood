import { NextRequest, NextResponse } from 'next/server'
import { processWithGemini } from '@/lib/ai/gemini-reservation'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action')

  // Lista modelos disponíveis: ?action=list
  if (action === 'list') {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`,
      )
      const data = await res.json()
      const names = (data.models ?? []).map((m: any) => m.name)
      return NextResponse.json({ models: names })
    } catch (err: any) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
    }
  }

  // Testa resposta da IA: ?msg=ola+quero+reserva
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
