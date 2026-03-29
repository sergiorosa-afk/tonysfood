import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

export const dynamic = 'force-dynamic'

export async function GET() {
  const unitId = 'test-diag'
  const sessionsDir = path.join(process.cwd(), '.whatsapp-sessions', unitId)
  const stateFile = path.join(sessionsDir, 'state.json')
  const workerPath = path.join(process.cwd(), 'lib', 'whatsapp-web', 'worker.js')

  fs.mkdirSync(sessionsDir, { recursive: true })
  // Clear previous state
  try { fs.unlinkSync(stateFile) } catch {}

  const logs: string[] = []

  logs.push(`worker path: ${workerPath}`)
  logs.push(`worker exists: ${fs.existsSync(workerPath)}`)
  logs.push(`node: ${process.execPath}`)

  const child = spawn(process.execPath, [workerPath, unitId], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, WS_NO_BUFFER_UTIL: '1', WS_NO_UTF_8_VALIDATE: '1' },
  })

  child.stdout?.on('data', (d: Buffer) => logs.push(`stdout: ${d.toString().trim()}`))
  child.stderr?.on('data', (d: Buffer) => logs.push(`stderr: ${d.toString().trim()}`))
  child.on('exit', (code) => logs.push(`exit: ${code}`))

  // Poll state file for up to 20s
  const result = await new Promise<{ ok: boolean; state?: any }>((resolve) => {
    let attempts = 0
    const interval = setInterval(() => {
      attempts++
      try {
        const raw = fs.readFileSync(stateFile, 'utf8')
        const state = JSON.parse(raw)
        logs.push(`state poll #${attempts}: ${state.status}, hasQR: ${!!state.qr}`)
        if (state.status === 'qr' && state.qr) {
          clearInterval(interval)
          child.kill()
          resolve({ ok: true, state })
          return
        }
        if (state.status === 'disconnected' && state.error) {
          clearInterval(interval)
          child.kill()
          resolve({ ok: false, state })
          return
        }
      } catch {
        logs.push(`state poll #${attempts}: file not ready`)
      }
      if (attempts >= 24) { // 24 * 2.5s = 60s
        clearInterval(interval)
        child.kill()
        resolve({ ok: false, state: { status: 'timeout' } })
      }
    }, 2500)
  })

  // Cleanup
  fs.rmSync(sessionsDir, { recursive: true, force: true })

  return NextResponse.json({
    ok: result.ok,
    logs,
    status: result.state?.status,
    hasQR: !!result.state?.qr,
    error: result.state?.error,
  })
}
