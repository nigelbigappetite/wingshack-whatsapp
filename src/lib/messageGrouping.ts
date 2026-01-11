// Utility functions for grouping messages

export interface MessageGroup {
  id: string
  direction: 'in' | 'out'
  messages: Array<{
    id: string
    body: string | null
    created_at: string
    status: string
    message_type?: string | null
    media_url?: string | null
    mime_type?: string | null
    file_name?: string | null
  }>
  firstMessageTime: string
  lastMessageTime: string
}

export interface Message {
  id: string
  direction: 'in' | 'out'
  body: string | null
  created_at: string
  status: string
  message_type?: string | null
  media_url?: string | null
  mime_type?: string | null
  file_name?: string | null
}

/**
 * Group consecutive messages from the same sender within 5 minutes
 */
export function groupMessages(messages: Message[]): MessageGroup[] {
  if (messages.length === 0) return []

  const groups: MessageGroup[] = []
  let currentGroup: MessageGroup | null = null

  const GROUP_TIME_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

  for (const message of messages) {
    const messageTime = new Date(message.created_at).getTime()

    // Check if we should start a new group
    if (
      !currentGroup ||
      currentGroup.direction !== message.direction ||
      messageTime - new Date(currentGroup.lastMessageTime).getTime() > GROUP_TIME_THRESHOLD_MS
    ) {
      // Start a new group
      currentGroup = {
        id: `group-${message.id}`,
        direction: message.direction,
        messages: [message],
        firstMessageTime: message.created_at,
        lastMessageTime: message.created_at,
      }
      groups.push(currentGroup)
    } else {
      // Add to current group
      currentGroup.messages.push(message)
      currentGroup.lastMessageTime = message.created_at
    }
  }

  return groups
}

