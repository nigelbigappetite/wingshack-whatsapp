'use client'

import { useEffect, useState } from 'react'
import { supabaseClient } from '@/src/lib/supabaseClient'

interface Message {
  id: string
  thread_id: string
  direction: 'in' | 'out'
  body: string
  created_at: string
  status: string
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

  const fetchMessages = async () => {
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
        .select('id, thread_id, direction, body, created_at, status')
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
  }

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
  }, [threadId])

  useEffect(() => {
    if (!threadId) return

    // Subscribe to real-time updates on messages table
    const channel = supabaseClient
      .channel(`messages-${threadId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        async (payload) => {
          console.log('[MessagesList] Real-time update received:', payload.eventType, payload)
          
          // Refetch messages when any change occurs
          const { data: messagesData, error: messagesError } = await supabaseClient
            .from('messages')
            .select('id, thread_id, direction, body, created_at, status')
            .eq('thread_id', threadId)
            .order('created_at', { ascending: true })

          if (!messagesError && messagesData) {
            setMessages(messagesData)
            console.log('[MessagesList] Messages updated via real-time:', messagesData.length)
          }
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabaseClient.removeChannel(channel)
    }
  }, [threadId])

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
          <div className="message-bubble">{message.body}</div>
          <div className="message-time">{formatTime(message.created_at)}</div>
        </div>
      ))}
    </div>
  )
}


