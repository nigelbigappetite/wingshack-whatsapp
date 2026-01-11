'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

type ThreadStatus = 'open' | 'pending' | 'resolved' | 'closed'

export function ThreadFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<ThreadStatus | ''>(searchParams.get('status') as ThreadStatus || '')
  const [unread, setUnread] = useState(searchParams.get('unread') === 'true')

  const updateFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (status) {
      params.set('status', status)
    } else {
      params.delete('status')
    }

    if (unread) {
      params.set('unread', 'true')
    } else {
      params.delete('unread')
    }

    router.push(`/inbox?${params.toString()}`, { scroll: false })
  }, [status, unread, router, searchParams])

  const handleStatusChange = (newStatus: ThreadStatus | '') => {
    setStatus(newStatus)
    setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (newStatus) {
        params.set('status', newStatus)
      } else {
        params.delete('status')
      }
      router.push(`/inbox?${params.toString()}`, { scroll: false })
    }, 0)
  }

  const handleUnreadChange = (checked: boolean) => {
    setUnread(checked)
    setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (checked) {
        params.set('unread', 'true')
      } else {
        params.delete('unread')
      }
      router.push(`/inbox?${params.toString()}`, { scroll: false })
    }, 0)
  }

  return (
    <div className="thread-filters">
      <div className="filter-group">
        <label>Status:</label>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value as ThreadStatus | '')}
          className="filter-select"
        >
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="filter-group">
        <label>
          <input
            type="checkbox"
            checked={unread}
            onChange={(e) => handleUnreadChange(e.target.checked)}
            className="filter-checkbox"
          />
          Unread only
        </label>
      </div>
    </div>
  )
}

