'use client'

interface SLABadgeProps {
  firstResponseDueAt: string | null
  followUpDueAt: string | null
  slaBreachedAt: string | null
}

export function SLABadge({
  firstResponseDueAt,
  followUpDueAt,
  slaBreachedAt,
}: SLABadgeProps) {
  if (slaBreachedAt) {
    return (
      <span
        style={{
          backgroundColor: '#f44336',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 500,
          marginLeft: '8px',
        }}
      >
        SLA Breached
      </span>
    )
  }

  const now = new Date()
  let dueDate: Date | null = null
  let label = ''

  if (firstResponseDueAt) {
    dueDate = new Date(firstResponseDueAt)
    label = 'First Response'
  } else if (followUpDueAt) {
    dueDate = new Date(followUpDueAt)
    label = 'Follow-up'
  }

  if (!dueDate) return null

  const hoursUntilDue = (dueDate.getTime() - now.getTime()) / 3600000

  if (hoursUntilDue < 0) {
    return (
      <span
        style={{
          backgroundColor: '#ff9800',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 500,
          marginLeft: '8px',
        }}
      >
        {label} Due
      </span>
    )
  }

  if (hoursUntilDue < 1) {
    return (
      <span
        style={{
          backgroundColor: '#ff9800',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 500,
          marginLeft: '8px',
        }}
      >
        {label} Soon
      </span>
    )
  }

  return null // Don't show badge if SLA is not urgent
}

