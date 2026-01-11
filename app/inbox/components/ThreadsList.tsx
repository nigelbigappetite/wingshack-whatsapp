'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabaseClient } from '@/src/lib/supabaseClient'

interface Thread {
  id: string
  contact_id: string
  last_message_at: string
  last_message_preview: string | null
  status?: 'open' | 'pending' | 'resolved' | 'closed'
  unread_count?: number
  first_response_due_at?: string | null
  follow_up_due_at?: string | null
  sla_breached_at?: string | null
  contacts?: {
    id: string
    phone_e164: string
  } | Array<{
    id: string
    phone_e164: string
  }>
}

export function ThreadsList({ selectedThreadId }: { selectedThreadId?: string }) {
  const searchParams = useSearchParams()
  const [threads, setThreads] = useState<Thread[]>([])
  const [contacts, setContacts] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch threads (with search/filter if params present)
  const fetchThreads = useCallback(async () => {
    try {
      setLoading(true)
      
      const q = searchParams.get('q')
      const status = searchParams.get('status')
      const unread = searchParams.get('unread') === 'true'

      // If search/filter params exist, use search API
      if (q || status || unread) {
        const params = new URLSearchParams()
        if (q) params.set('q', q)
        if (status) params.set('status', status)
        if (unread) params.set('unread', 'true')

        const response = await fetch(`/api/threads/search?${params.toString()}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to search threads')
        }

        setThreads(data.threads || [])
        
        // Extract contacts
        const contactMap = new Map<string, string>()
        data.threads?.forEach((thread: any) => {
          const contact = thread.contacts
          if (contact?.phone_e164) {
            contactMap.set(thread.contact_id, contact.phone_e164)
          }
        })
        setContacts(contactMap)
        return
      }

      // Otherwise, fetch all threads normally
      const { data: threadsData, error: threadsError } = await supabaseClient
        .from('threads')
        .select(`
          id,
          contact_id,
          last_message_at,
          last_message_preview,
          status,
          unread_count,
          first_response_due_at,
          follow_up_due_at,
          sla_breached_at,
          contacts!contact_id (
            id,
            phone_e164
          )
        `)
        .order('last_message_at', { ascending: false })

      if (threadsError) {
        console.error('[ThreadsList] Error fetching threads:', threadsError)
        setError(threadsError.message)
        return
      }

      console.log('[ThreadsList] Raw threads query result count:', threadsData?.length || 0)

      if (!threadsData) {
        setThreads([])
        setLoading(false)
        return
      }

      setThreads(threadsData as Thread[])

      // Extract contacts
      const contactMap = new Map<string, string>()
      threadsData.forEach((thread: any) => {
        const contact = Array.isArray(thread.contacts) 
          ? thread.contacts[0] 
          : thread.contacts
        if (contact?.phone_e164) {
          contactMap.set(thread.contact_id, contact.phone_e164)
        }
      })
      setContacts(contactMap)

      console.log('[ThreadsList] Contact map size:', contactMap.size)
      console.log('[ThreadsList] Processed threads count:', threadsData.length)
    } catch (err: any) {
      console.error('[ThreadsList] Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    fetchThreads()

    // Subscribe to real-time updates on threads table
    const channel = supabaseClient
      .channel(`threads-changes-${Date.now()}`) // Unique channel name
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // New threads
          schema: 'public',
          table: 'threads',
        },
        async (payload) => {
          console.log('[ThreadsList] New thread created via real-time:', payload)
          fetchThreads()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // Thread updates (new messages update last_message_at)
          schema: 'public',
          table: 'threads',
        },
        async (payload) => {
          console.log('[ThreadsList] Thread updated via real-time:', payload)
          fetchThreads()
        }
      )
      .subscribe((status) => {
        console.log(`[ThreadsList] Subscription status: ${status}`)
        if (status === 'SUBSCRIBED') {
          console.log('[ThreadsList] Successfully subscribed to real-time updates')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[ThreadsList] Channel subscription error')
        }
      })

    // Also subscribe to messages table to catch new inbound messages immediately
    // This ensures we update threads as soon as a message arrives
    const messagesChannel = supabaseClient
      .channel(`threads-messages-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: 'direction=eq.in', // Only inbound messages
        },
        async (payload) => {
          console.log('[ThreadsList] New inbound message detected, refreshing threads:', payload)
          // Small delay to ensure thread is updated first
          setTimeout(() => {
            fetchThreads()
          }, 300)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[ThreadsList] Successfully subscribed to messages for thread updates')
        }
      })

    // Cleanup subscriptions on unmount
    return () => {
      supabaseClient.removeChannel(channel)
      supabaseClient.removeChannel(messagesChannel)
    }
  }, [fetchThreads])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="threads-list">
        <div className="empty-state">Loading threads...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="threads-list">
        <div className="empty-state" style={{ color: 'red' }}>
          Error: {error}
        </div>
      </div>
    )
  }

  if (!threads || threads.length === 0) {
    return (
      <div className="threads-list">
        <div className="empty-state">No threads yet</div>
      </div>
    )
  }

  return (
    <div className="threads-list">
      {threads.map((thread) => {
        const phone = contacts.get(thread.contact_id) || 'Unknown'
        const isActive = selectedThreadId === thread.id

        return (
          <Link
            key={thread.id}
            href={`/inbox?thread=${thread.id}`}
            className={`thread-item ${isActive ? 'active' : ''}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div className="thread-phone">{phone}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {thread.status && <ThreadStatusBadge status={thread.status} />}
                {thread.unread_count && thread.unread_count > 0 && (
                  <UnreadIndicator count={thread.unread_count} />
                )}
                <SLABadge
                  firstResponseDueAt={thread.first_response_due_at || null}
                  followUpDueAt={thread.follow_up_due_at || null}
                  slaBreachedAt={thread.sla_breached_at || null}
                />
              </div>
            </div>
            <div className="thread-preview">
              {thread.last_message_preview || 'No messages'}
            </div>
            <div className="thread-time">{formatTime(thread.last_message_at)}</div>
          </Link>
        )
      })}
    </div>
  )
}
