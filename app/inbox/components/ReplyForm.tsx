'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ReplyFormProps {
  threadId: string
}

export function ReplyForm({ threadId }: ReplyFormProps) {
  const [body, setBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!body.trim() || isSubmitting) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thread_id: threadId,
          body: body.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Error sending message:', error)
        alert('Failed to send message')
        return
      }

      // Clear input and refresh
      setBody('')
      router.refresh()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="reply-form" onSubmit={handleSubmit}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Type a message..."
        disabled={isSubmitting}
      />
      <button type="submit" disabled={isSubmitting || !body.trim()}>
        {isSubmitting ? 'Sending...' : 'Send'}
      </button>
    </form>
  )
}

