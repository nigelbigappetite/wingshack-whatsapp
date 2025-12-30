/**
 * Normalizes a phone number string
 * - Trims whitespace
 * - Ensures it starts with '+'
 */
export function normalizePhone(phone: string): string {
  const trimmed = phone.trim()
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`
}

