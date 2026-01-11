'use client'

interface MessageStatusProps {
  status: string
}

export function MessageStatus({ status }: MessageStatusProps) {
  // Map message status to display status
  // 'queued' -> sent (gray)
  // 'sent' -> delivered (blue)
  // 'delivered' -> delivered (blue)
  // 'read' -> read (green)
  // 'failed' -> failed (red)
  
  let displayStatus: 'sent' | 'delivered' | 'read' | 'failed' = 'sent'
  if (status === 'read') {
    displayStatus = 'read'
  } else if (status === 'delivered' || status === 'sent') {
    displayStatus = 'delivered'
  } else if (status === 'failed') {
    displayStatus = 'failed'
  }

  const getIcon = () => {
    switch (displayStatus) {
      case 'read':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 8L6 12L14 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 8L6 12L14 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" transform="translate(2, 0)"/>
          </svg>
        )
      case 'delivered':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 8L6 12L14 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      case 'failed':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 5V8M8 11H8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )
      default: // sent
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 8L6 12L14 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
          </svg>
        )
    }
  }

  return (
    <span className={`message-status ${displayStatus}`}>
      {getIcon()}
    </span>
  )
}

