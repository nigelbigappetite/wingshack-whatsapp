'use client'

type ThreadStatus = 'open' | 'pending' | 'resolved' | 'closed'

interface ThreadStatusBadgeProps {
  status: ThreadStatus
}

const statusColors: Record<ThreadStatus, string> = {
  open: '#4caf50',
  pending: '#ff9800',
  resolved: '#2196f3',
  closed: '#9e9e9e',
}

export function ThreadStatusBadge({ status }: ThreadStatusBadgeProps) {
  return (
    <span
      className="status-badge"
      style={{
        backgroundColor: statusColors[status],
        color: 'white',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 500,
        textTransform: 'uppercase',
      }}
    >
      {status}
    </span>
  )
}

