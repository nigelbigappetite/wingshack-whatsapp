'use client'

interface UnreadIndicatorProps {
  count: number
}

export function UnreadIndicator({ count }: UnreadIndicatorProps) {
  if (count <= 0) return null

  return (
    <span
      className="unread-indicator"
      style={{
        backgroundColor: '#f44336',
        color: 'white',
        borderRadius: '50%',
        width: '20px',
        height: '20px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        fontWeight: 600,
        marginLeft: '8px',
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

