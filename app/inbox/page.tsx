import { ThreadsList } from './components/ThreadsList'
import { MessagesList } from './components/MessagesList'
import { ReplyForm } from './components/ReplyForm'
import { MessageHeader } from './components/MessageHeader'
// Temporarily disabled for simplification
// import { SystemStatus } from './components/SystemStatus'
// import { ThreadSearch } from './components/ThreadSearch'
// import { ThreadFilters } from './components/ThreadFilters'
// import { MarkThreadRead } from './components/MarkThreadRead'
// import { ChannelSelector } from './components/ChannelSelector'

export const dynamic = 'force-dynamic'

interface InboxPageProps {
  searchParams: { thread?: string }
}

export default function Inbox({ searchParams }: InboxPageProps) {
  const selectedThreadId = searchParams.thread

  return (
    <div className="inbox-container">
      <div>
        {/* Temporarily disabled for simplification */}
        {/* <SystemStatus /> */}
        {/* <ChannelSelector /> */}
        {/* <ThreadSearch /> */}
        {/* <ThreadFilters /> */}
        <ThreadsList selectedThreadId={selectedThreadId} />
      </div>
      <div className="messages-view">
        {selectedThreadId ? (
          <>
            <MessageHeader threadId={selectedThreadId} />
            {/* <MarkThreadRead threadId={selectedThreadId} /> */}
            <MessagesList threadId={selectedThreadId} />
            <ReplyForm threadId={selectedThreadId} />
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <div className="empty-state-message">Select a conversation</div>
            <div className="empty-state-hint">Choose a thread from the left to start messaging</div>
          </div>
        )}
      </div>
    </div>
  )
}
