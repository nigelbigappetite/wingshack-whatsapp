'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabaseClient } from '@/src/lib/supabaseClient'
import { MessageAttachment } from './MessageAttachment'
import { MessageStatus } from './MessageStatus'
import { groupMessages, MessageGroup } from '@/src/lib/messageGrouping'

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
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
      
      // Scroll to bottom after messages load
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
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
          
          // Scroll to bottom after new message
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 200)
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
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [messages.length])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Group messages
  const messageGroups = groupMessages(messages)

  if (loading) {
    return (
      <div className="messages-list">
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <div className="empty-state-message">Loading messages...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="messages-list">
        <div className="empty-state" style={{ color: 'red' }}>
          <div className="empty-state-icon">⚠️</div>
          <div className="empty-state-message">Error: {error}</div>
        </div>
      </div>
    )
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="messages-list">
        <div className="empty-state">
          <div className="empty-state-icon">💭</div>
          <div className="empty-state-message">No messages yet</div>
          <div className="empty-state-hint">Start the conversation!</div>
        </div>
      </div>
    )
  }

  return (
    <div className="messages-list">
      {messageGroups.map((group: MessageGroup) => (
        <div
          key={group.id}
          className={`message-group message-${group.direction}`}
        >
          {group.messages.map((message, index) => {
            const isLastInGroup = index === group.messages.length - 1
            const showTime = isLastInGroup

            return (
              <div
                key={message.id}
                className="message-item"
              >
                <div className="message-bubble">
                  {message.body && <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.body}</p>}
                  {message.media_url && (
                    <MessageAttachment
                      mediaUrl={message.media_url}
                      mimeType={message.mime_type}
                      fileName={message.file_name}
                      messageType={message.message_type}
                    />
                  )}
                </div>
                {showTime && (
                  <div className="message-time">
                    {formatTime(message.created_at)}
                    {group.direction === 'out' && (
                      <MessageStatus status={message.status} />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}


