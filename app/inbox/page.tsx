import { ThreadsList } from './components/ThreadsList'
import { MessagesList } from './components/MessagesList'
import { ReplyForm } from './components/ReplyForm'

interface InboxPageProps {
  searchParams: { thread?: string }
}

export default function Inbox({ searchParams }: InboxPageProps) {
  const selectedThreadId = searchParams.thread

  return (
    <div className="inbox-container">
      <ThreadsList selectedThreadId={selectedThreadId} />
      <div className="messages-view">
        {selectedThreadId ? (
          <MessagesList threadId={selectedThreadId} />
        ) : (
          <div className="empty-state">Select a conversation</div>
        )}
        {selectedThreadId && <ReplyForm threadId={selectedThreadId} />}
      </div>
    </div>
  )
}
