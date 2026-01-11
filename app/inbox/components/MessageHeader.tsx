'use client'

import { useEffect, useState } from 'react'
import { supabaseClient } from '@/src/lib/supabaseClient'
import { getInitialsFromPhone, getColorFromPhone } from '@/src/lib/avatarUtils'

interface MessageHeaderProps {
  threadId: string
}

export function MessageHeader({ threadId }: MessageHeaderProps) {
  const [contactPhone, setContactPhone] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchContact() {
      try {
        // Get thread with contact
        const { data: thread, error: threadError } = await supabaseClient
          .from('threads')
          .select(`
            contact_id,
            contacts!contact_id (
              phone_e164
            )
          `)
          .eq('id', threadId)
          .single()

        if (threadError) {
          console.error('[MessageHeader] Error fetching contact:', threadError)
          return
        }

        const contact = Array.isArray(thread.contacts) 
          ? thread.contacts[0] 
          : thread.contacts

        if (contact?.phone_e164) {
          setContactPhone(contact.phone_e164)
        }
      } catch (err) {
        console.error('[MessageHeader] Error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (threadId) {
      fetchContact()
    }
  }, [threadId])

  if (loading || !contactPhone) {
    return (
      <div className="message-header">
        <div className="message-header-content">
          <div className="message-header-avatar" style={{ backgroundColor: '#999' }}>
            ...
          </div>
          <div className="message-header-info">
            <div className="message-header-name">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  const initials = getInitialsFromPhone(contactPhone)
  const avatarColor = getColorFromPhone(contactPhone)

  return (
    <div className="message-header">
      <div className="message-header-content">
        <div
          className="message-header-avatar"
          style={{ backgroundColor: avatarColor }}
        >
          {initials}
        </div>
        <div className="message-header-info">
          <div className="message-header-name">{contactPhone}</div>
          <div className="message-header-status">WhatsApp</div>
        </div>
      </div>
      <div className="message-header-actions">
        {/* Placeholder for future actions (info, more options) */}
      </div>
    </div>
  )
}

