import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Signs a payload with HMAC-SHA256 and returns hex digest.
 */
export function signPayload(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Verifies an HMAC-SHA256 signature from an incoming request.
 * Accepts "sha256=<hex>" or plain hex.
 */
export function verifySignature(
  secret: string,
  rawBody: string,
  signature: string
): boolean {
  const clean = signature.startsWith('sha256=') ? signature.slice(7) : signature
  const expected = signPayload(secret, rawBody)
  try {
    return timingSafeEqual(Buffer.from(clean, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

/**
 * Builds the X-Signature header value for outbound webhooks.
 */
export function buildSignatureHeader(secret: string, body: string): string {
  return `sha256=${signPayload(secret, body)}`
}
