// Utility functions for generating avatars from phone numbers

/**
 * Generate initials from a phone number
 * Uses the last 2 digits to create initials
 */
export function getInitialsFromPhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  if (digits.length === 0) return '??'
  
  // Use last 2 digits to generate initials
  // Map digits to letters (0-9 -> A-J)
  const lastTwo = digits.slice(-2)
  const char1 = String.fromCharCode(65 + (parseInt(lastTwo[0]) % 10)) // A-J
  const char2 = String.fromCharCode(65 + (parseInt(lastTwo[1] || lastTwo[0]) % 10)) // A-J
  
  return `${char1}${char2}`.toUpperCase()
}

/**
 * Generate a consistent color from a phone number
 * Uses a simple hash function to map phone to color
 */
export function getColorFromPhone(phone: string): string {
  // Color palette for avatars (modern, accessible colors)
  const colors = [
    '#1976d2', // Blue
    '#388e3c', // Green
    '#f57c00', // Orange
    '#7b1fa2', // Purple
    '#c2185b', // Pink
    '#0288d1', // Light Blue
    '#00796b', // Teal
    '#5d4037', // Brown
    '#455a64', // Blue Grey
    '#d32f2f', // Red
  ]
  
  // Simple hash function
  let hash = 0
  for (let i = 0; i < phone.length; i++) {
    hash = phone.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

