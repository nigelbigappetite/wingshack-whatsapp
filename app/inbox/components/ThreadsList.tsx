'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/src/lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface Thread {
  id: string
  contact_id: string
  last_message_at: string
  last_message_preview: string | null
  contacts?: {
    id: string
    phone_e164: string
  } | Array<{
    id: string
    phone_e164: string
  }>
}

export function ThreadsList({ selectedThreadId }: { selectedThreadId?: string }) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [contacts, setContacts] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch initial threads and contacts
  useEffect(() => {
    async function fetchThreads() {
      try {
        setLoading(true)
        
        // Fetch threads with contact join
        const { data: threadsData, error: threadsError } = await supabaseClient
          .from('threads')
          .select(`
            id,
            contact_id,
            last_message_at,
            last_message_preview,
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
    }

    fetchThreads()

    // Subscribe to real-time updates on threads table
    const channel = supabaseClient
      .channel('threads-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'threads',
        },
        async (payload) => {
          console.log('[ThreadsList] Real-time update received:', payload.eventType, payload)
          
          // Refetch threads when any change occurs
          const { data: threadsData, error: threadsError } = await supabaseClient
            .from('threads')
            .select(`
              id,
              contact_id,
              last_message_at,
              last_message_preview,
              contacts!contact_id (
                id,
                phone_e164
              )
            `)
            .order('last_message_at', { ascending: false })

          if (!threadsError && threadsData) {
            setThreads(threadsData as Thread[])
            
            // Update contacts map
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
            
            console.log('[ThreadsList] Threads updated via real-time:', threadsData.length)
          }
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabaseClient.removeChannel(channel)
    }
  }, [])

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
            <div className="thread-phone">{phone}</div>
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
