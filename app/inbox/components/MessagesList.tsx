import { supabaseAdmin } from '@/src/lib/supabaseAdmin'

interface Message {
  id: string
  thread_id: string
  direction: 'in' | 'out'
  body: string
  created_at: string
  status: string
}

export async function MessagesList({ threadId }: { threadId: string }) {
  const { data: messages, error } = await supabaseAdmin
    .from('messages')
    .select('id, thread_id, direction, body, created_at, status')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return <div className="messages-list">Error loading messages</div>
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="messages-list">
        <div className="empty-state">No messages yet</div>
      </div>
    )
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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


