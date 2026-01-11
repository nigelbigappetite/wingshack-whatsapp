import { randomUUID } from 'crypto'

// Generate a correlation ID (UUID v4)
export function generateCorrelationId(): string {
  return randomUUID()
}

// Store correlation ID in async context (for server-side)
// In Next.js, we can use headers to pass correlation IDs
export function getCorrelationIdFromHeaders(headers: Headers): string | null {
  return headers.get('x-correlation-id') || headers.get('x-request-id') || null
}

// Generate or get correlation ID from request
export function getOrCreateCorrelationId(headers: Headers): string {
  const existing = getCorrelationIdFromHeaders(headers)
  return existing || generateCorrelationId()
}

