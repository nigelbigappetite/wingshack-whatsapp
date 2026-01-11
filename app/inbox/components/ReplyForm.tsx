'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TemplatePicker } from './TemplatePicker'

interface ReplyFormProps {
  threadId: string
}

export function ReplyForm({ threadId }: ReplyFormProps) {
  const [body, setBody] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attachment, setAttachment] = useState<File | null>(null)
  const router = useRouter()
  const canSendMessage = useCanSendMessage()

  const canSend = canSendMessage && Boolean(threadId) && body.trim().length > 0 && !isSending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!canSend) {
      return
    }

    setIsSending(true)
    setError(null)

    try {
      let response: Response

      if (attachment) {
        // Send with attachment (multipart/form-data)
        const formData = new FormData()
        formData.append('thread_id', threadId)
        formData.append('body', body.trim())
        formData.append('attachment', attachment)

        response = await fetch('/api/messages/send', {
          method: 'POST',
          body: formData,
        })
      } else {
        // Send text only (JSON)
        response = await fetch('/api/messages/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            thread_id: threadId,
            body: body.trim(),
          }),
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to send message')
        return
      }

      const result = await response.json()
      
      // Clear input and attachment immediately
      setBody('')
      setAttachment(null)
      
      // Trigger manual refresh of messages list
      window.dispatchEvent(new CustomEvent('refresh-messages'))
      
      // Also refresh page as fallback
      setTimeout(() => {
        router.refresh()
      }, 500)
    } catch (error) {
      console.error('Error sending message:', error)
      setError('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const handleTemplateSelect = (renderedText: string) => {
    setBody(renderedText)
  }

  return (
    <form className="reply-form" onSubmit={handleSubmit}>
      <TemplatePicker threadId={threadId} onSelect={handleTemplateSelect} />
      <AttachmentUpload
        onFileSelect={setAttachment}
        onRemove={() => setAttachment(null)}
        selectedFile={attachment}
      />
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
