// Track last webhook received timestamp (in-memory for now)
let lastWebhookReceivedAt: string | null = null

// Export function to update last webhook time (called from webhook handler)
export function updateLastWebhookTime() {
  lastWebhookReceivedAt = new Date().toISOString()
}

// Get last webhook time
export function getLastWebhookTime(): string | null {
  return lastWebhookReceivedAt
}

