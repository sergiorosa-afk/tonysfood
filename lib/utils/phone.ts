/**
 * Normaliza um número de telefone brasileiro para o formato completo
 * exigido pela API do WhatsApp: 55 + DDD + número (ex: 5511999990000)
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return ''
  // Já tem código do país 55 e comprimento mínimo
  if (digits.startsWith('55') && digits.length >= 12) return digits
  // DDD + número (10 ou 11 dígitos) → adiciona 55
  if (digits.length >= 10) return `55${digits}`
  return digits
}

/**
 * Retorna todas as variantes de um telefone para busca no banco,
 * cobrindo casos em que o número foi salvo com ou sem o prefixo 55.
 */
export function phoneVariants(phone: string): string[] {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return []
  const normalized = normalizePhone(digits)
  const withoutPrefix = normalized.startsWith('55') ? normalized.slice(2) : normalized
  return [...new Set([normalized, withoutPrefix, `55${withoutPrefix}`])]
}
