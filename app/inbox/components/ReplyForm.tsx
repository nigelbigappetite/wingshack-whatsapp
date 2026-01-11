'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
// Temporarily disabled for simplification
// import { TemplatePicker } from './TemplatePicker'
// import { AttachmentUpload } from './AttachmentUpload'

interface ReplyFormProps {
  threadId: string
}

export function ReplyForm({ threadId }: ReplyFormProps) {
  const [body, setBody] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Temporarily disabled for simplification
  // const [attachment, setAttachment] = useState<File | null>(null)
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
      // Simplified: text only for now
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

      const result = await response.json()
      
      // Clear input immediately
      setBody('')
      // setAttachment(null) // Temporarily disabled
      
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

  // Temporarily disabled for simplification
  // const handleTemplateSelect = (renderedText: string) => {
  //   setBody(renderedText)
  // }

  const characterCount = body.length
  const maxLength = 4096 // WhatsApp message limit

  return (
    <form className="reply-form" onSubmit={handleSubmit}>
      {/* Temporarily disabled for simplification */}
      {/* <TemplatePicker threadId={threadId} onSelect={handleTemplateSelect} /> */}
      {/* <AttachmentUpload
        onFileSelect={setAttachment}
        onRemove={() => setAttachment(null)}
        selectedFile={attachment}
      /> */}
      {error && (
        <div style={{ fontSize: '12px', color: '#e00', marginBottom: '8px', padding: '0 4px' }}>
          {error}
        </div>
      )}
      <div className="reply-form-wrapper">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message..."
          disabled={isSending}
          maxLength={maxLength}
          rows={1}
          style={{
            height: 'auto',
            minHeight: '60px',
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = 'auto'
            target.style.height = `${Math.min(target.scrollHeight, 120)}px`
          }}
        />
        <div className="reply-form-actions">
          <button type="submit" disabled={!canSend}>
            {isSending ? 'Sending...' : 'Send'}
          </button>
          {characterCount > 0 && (
            <div className="reply-form-char-count">
              {characterCount}/{maxLength}
            </div>
          )}
        </div>
      </div>
    </form>
  )
}
