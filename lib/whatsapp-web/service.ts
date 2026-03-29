import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'

export type WaWebStatus = 'disconnected' | 'qr' | 'connecting' | 'connected'

export interface WaWebState {
  status: WaWebStatus
  qr?: string
  phone?: string
  name?: string
  unitId?: string
  error?: string
}

const SESSION_ROOT = path.join(process.cwd(), '.whatsapp-sessions')

// On TRUE server startup (not hot reload): reset stale states.
// Guard: skip if a worker child is already tracked in globalThis (hot reload scenario).
try {
  const existingProc = (globalThis as any).__waWebProc
  const workerAlive = existingProc?.child && !existingProc.child.killed
  if (!workerAlive) {
    for (const dir of fs.readdirSync(SESSION_ROOT)) {
      const statePath = path.join(SESSION_ROOT, dir, 'state.json')
      try {
        const state = JSON.parse(fs.readFileSync(statePath, 'utf8'))
        if (state.status !== 'disconnected') {
          fs.writeFileSync(statePath, JSON.stringify({ status: 'disconnected' }), 'utf8')
        }
      } catch {}
    }
  }
} catch {}

// Global singleton
const g = globalThis as any
function getProc(): { child: ChildProcess | null; unitId: string | null } {
  if (!g.__waWebProc) g.__waWebProc = { child: null, unitId: null }
  return g.__waWebProc
}

function stateFilePath(unitId: string) {
  return path.join(SESSION_ROOT, unitId, 'state.json')
}

function readStateFromDisk(unitId: string): WaWebState | null {
  try {
    return JSON.parse(fs.readFileSync(stateFilePath(unitId), 'utf8')) as WaWebState
  } catch {
    return null
  }
}

function findActiveUnitId(): string | null {
  try {
    for (const dir of fs.readdirSync(SESSION_ROOT)) {
      const state = readStateFromDisk(dir)
      if (state && state.status !== 'disconnected') return dir
    }
  } catch {}
  return null
}

export function isWaWebWorkerRunning(): boolean {
  const proc = getProc()
  return !!(proc.child && !proc.child.killed)
}

export function getWaWebState(): WaWebState {
  const proc = getProc()
  const uid = proc.unitId ?? findActiveUnitId()
  if (!uid) return { status: 'disconnected' }
  if (!proc.unitId) proc.unitId = uid
  return readStateFromDisk(uid) ?? { status: 'disconnected' }
}

export function getWaWebStateForUnit(unitId: string): WaWebState {
  return readStateFromDisk(unitId) ?? { status: 'disconnected' }
}

export function startWaWebConnection(unitId: string): void {
  const proc = getProc()

  // If worker is alive but state is disconnected, it's stuck — kill and restart
  if (proc.child && !proc.child.killed) {
    const state = readStateFromDisk(unitId)
    if (state && state.status !== 'disconnected') return // genuinely active
    proc.child.kill()
    proc.child = null
  }

  fs.mkdirSync(path.join(SESSION_ROOT, unitId), { recursive: true })

  const workerPath = path.join(process.cwd(), 'lib', 'whatsapp-web', 'worker.js')

  const child = spawn(process.execPath, [workerPath, unitId], {
    cwd: process.cwd(),
    // 'ipc' channel enables child.send() / process.on('message')
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    detached: false,
    env: {
      ...process.env,
      WS_NO_BUFFER_UTIL: '1',
      WS_NO_UTF_8_VALIDATE: '1',
    },
  })

  child.stdout?.on('data', (d: Buffer) => console.log('[WaWeb]', d.toString().trimEnd()))
  child.stderr?.on('data', (d: Buffer) => console.error('[WaWeb]', d.toString().trimEnd()))

  child.on('exit', (code) => {
    console.log('[WaWeb] worker exited with code', code)
    const p = getProc()
    if (p.child === child) p.child = null
  })

  proc.child = child
  proc.unitId = unitId
}

export function sendWaWebMessage(unitId: string, to: string, text: string): void {
  const proc = getProc()

  // Recover child reference if lost after hot-reload but worker still running
  if (!proc.child || proc.child.killed) {
    // Can't send — worker not running. Log for visibility.
    console.warn('[WaWeb] sendWaWebMessage: worker not running for unit', unitId)
    return
  }

  try {
    proc.child.send({ action: 'send', to, text })
  } catch (err) {
    console.error('[WaWeb] sendWaWebMessage IPC error:', err)
  }
}

export async function disconnectWaWeb(): Promise<void> {
  const proc = getProc()

  if (proc.child && !proc.child.killed) {
    try { proc.child.send({ action: 'disconnect' }) } catch {}
    await new Promise<void>((resolve) => setTimeout(resolve, 3000))
    if (!proc.child.killed) proc.child.kill()
  }

  proc.child = null

  if (proc.unitId) {
    fs.rmSync(path.join(SESSION_ROOT, proc.unitId), { recursive: true, force: true })
  }
  proc.unitId = null
}
