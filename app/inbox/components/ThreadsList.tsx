import Link from 'next/link'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'

export async function ThreadsList({ selectedThreadId }: { selectedThreadId?: string }) {
  const { data: threads, error: threadsError } = await supabaseAdmin
    .from('threads')
    .select('id, contact_id, last_message_at, last_message_preview')
    .order('last_message_at', { ascending: false })

  if (threadsError) {
    console.error('Error fetching threads:', threadsError)
    return (
      <div className="threads-list">
        <div className="empty-state" style={{ color: 'red' }}>
          Error: {threadsError.message}
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

  // Fetch all contacts for these threads
  const contactIds = threads.map((t) => t.contact_id)
  const { data: contacts, error: contactsError } = await supabaseAdmin
    .from('contacts')
    .select('id, phone_e164')
    .in('id', contactIds)

  if (contactsError) {
    console.error('Error fetching contacts:', contactsError)
  }

  // Create a map of contact_id to phone_e164
  const contactMap = new Map(
    (contacts || []).map((c) => [c.id, c.phone_e164])
  )

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

  return (
    <div className="threads-list">
      {threads.map((thread) => {
        const phone = contactMap.get(thread.contact_id) || 'Unknown'
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
