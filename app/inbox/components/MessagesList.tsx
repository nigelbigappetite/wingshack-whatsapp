'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabaseClient } from '@/src/lib/supabaseClient'
import { MessageAttachment } from './MessageAttachment'

interface Message {
  id: string
  thread_id: string
  direction: 'in' | 'out'
  body: string
  created_at: string
  status: string
  message_type?: string | null
  media_url?: string | null
  mime_type?: string | null
  file_name?: string | null
}

// Global event listener for manual refresh
if (typeof window !== 'undefined') {
  window.addEventListener('message-sent', () => {
    // Trigger refresh in all MessagesList components
    window.dispatchEvent(new CustomEvent('refresh-messages'))
  })
}

export function MessagesList({ threadId }: { threadId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    if (!threadId) {
      setMessages([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data: messagesData, error: messagesError } = await supabaseClient
        .from('messages')
        .select('id, thread_id, direction, body, created_at, status, message_type, media_url, mime_type, file_name')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })

      if (messagesError) {
        console.error('[MessagesList] Error fetching messages:', messagesError)
        setError(messagesError.message)
        return
      }

      setMessages(messagesData || [])
    } catch (err: any) {
      console.error('[MessagesList] Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [threadId])

  useEffect(() => {
    fetchMessages()
    
    // Listen for manual refresh events
    const handleRefresh = () => {
      console.log('[MessagesList] Manual refresh triggered')
      fetchMessages()
    }
    
    window.addEventListener('refresh-messages', handleRefresh)
    
    return () => {
      window.removeEventListener('refresh-messages', handleRefresh)
    }
  }, [fetchMessages])

  useEffect(() => {
    if (!threadId) return

    console.log(`[MessagesList] Setting up real-time subscription for thread: ${threadId}`)

    // Subscribe to real-time updates on messages table
    const channel = supabaseClient
      .channel(`messages-${threadId}-${Date.now()}`) // Unique channel name to avoid conflicts
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Specifically listen for new messages
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        async (payload) => {
          console.log('[MessagesList] New message received via real-time:', payload)
          
          // Immediately refetch messages to get the new one
          fetchMessages()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // Also listen for message updates (status changes)
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        async (payload) => {
          console.log('[MessagesList] Message updated via real-time:', payload)
          fetchMessages()
        }
      )
      .subscribe((status) => {
        console.log(`[MessagesList] Subscription status: ${status}`)
        if (status === 'SUBSCRIBED') {
          console.log('[MessagesList] Successfully subscribed to real-time updates')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[MessagesList] Channel subscription error')
        }
      })

    // Cleanup subscription on unmount
    return () => {
      console.log(`[MessagesList] Cleaning up subscription for thread: ${threadId}`)
      supabaseClient.removeChannel(channel)
    }
  }, [threadId, fetchMessages])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="messages-list">
        <div className="empty-state">Loading messages...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="messages-list">
        <div className="empty-state" style={{ color: 'red' }}>
          Error: {error}
        </div>
      </div>
    )
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="messages-list">
        <div className="empty-state">No messages yet</div>
      </div>
    )
  }

  return (
    <div className="messages-list">
      {messages.map((message: Message) => (
        <div
          key={message.id}
          className={`message-item message-${message.direction}`}
        >
          <div className="message-bubble">
            {message.body}
            {message.media_url && (
              <MessageAttachment
                mediaUrl={message.media_url}
                mimeType={message.mime_type}
                fileName={message.file_name}
                messageType={message.message_type}
              />
            )}
          </div>
          <div className="message-time">{formatTime(message.created_at)}</div>
        </div>
      ))}
    </div>
  )
}


