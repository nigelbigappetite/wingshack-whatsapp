'use client'

import { useEffect } from 'react'

interface MarkThreadReadProps {
  threadId: string
}

export function MarkThreadRead({ threadId }: MarkThreadReadProps) {
  useEffect(() => {
    // Mark thread as read when viewed
    const markAsRead = async () => {
      try {
        await fetch(`/api/threads/${threadId}/read`, {
          method: 'PATCH',
        })
      } catch (error) {
        console.error('Error marking thread as read:', error)
      }
    }

    markAsRead()
  }, [threadId])

  return null // This component doesn't render anything
}

