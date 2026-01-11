'use client'

import { useState } from 'react'
import { ThreadStatusBadge } from './ThreadStatusBadge'

type ThreadStatus = 'open' | 'pending' | 'resolved' | 'closed'

interface ThreadActionsProps {
  threadId: string
  currentStatus: ThreadStatus
  assignedTo?: string | null
  onStatusChange?: (status: ThreadStatus) => void
  onAssign?: (userId: string | null) => void
}

export function ThreadActions({
  threadId,
  currentStatus,
  assignedTo,
  onStatusChange,
  onAssign,
}: ThreadActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const canUpdateStatus = useCanPerformAction('update_thread_status')

  const handleStatusChange = async (newStatus: ThreadStatus) => {
    if (newStatus === currentStatus) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/threads/${threadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      onStatusChange?.(newStatus)
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="thread-actions">
      {canUpdateStatus && (
        <div className="action-group">
          <label>Status:</label>
          <select
            value={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value as ThreadStatus)}
            disabled={isUpdating}
            className="status-select"
          >
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <ThreadStatusBadge status={currentStatus} />
        </div>
      )}
    </div>
  )
}

