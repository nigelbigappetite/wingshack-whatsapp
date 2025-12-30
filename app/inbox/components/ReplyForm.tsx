'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ReplyFormProps {
  threadId: string
}

export function ReplyForm({ threadId }: ReplyFormProps) {
  const [body, setBody] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const canSend = Boolean(threadId) && body.trim().length > 0 && !isSending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!canSend) {
      return
    }

    setIsSending(true)
    setError(null)

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
        const errorData = await response.json()
        setError(errorData.error || 'Failed to send message')
        return
      }

      // Clear input and refresh
      setBody('')
      router.refresh()
    } catch (error) {
      console.error('Error sending message:', error)
      setError('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <form className="reply-form" onSubmit={handleSubmit}>
      <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px', padding: '0 4px' }}>
        threadId: {threadId || 'null'}
      </div>
      {error && (
        <div style={{ fontSize: '12px', color: '#e00', marginBottom: '8px', padding: '0 4px' }}>
          {error}
        </div>
      )}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Type a message..."
        disabled={isSending}
      />
      <button type="submit" disabled={!canSend}>
        {isSending ? 'Sending...' : 'Send'}
      </button>
    </form>
  )
}
