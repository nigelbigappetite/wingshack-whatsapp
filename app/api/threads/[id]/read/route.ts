import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'
import { logger } from '@/src/lib/logger'
import { getOrCreateCorrelationId } from '@/src/lib/correlation'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = getOrCreateCorrelationId(request.headers)
  const logContext = { request_id: requestId, thread_id: params.id }

  try {
    logger.info('thread_mark_read', logContext)

    const now = new Date().toISOString()

    // Get current unread_count
    const { data: currentThread } = await supabaseAdmin
      .from('threads')
      .select('unread_count')
      .eq('id', params.id)
      .single()

    const newUnreadCount = Math.max(0, (currentThread?.unread_count || 0) - 1)

    const { data: thread, error } = await supabaseAdmin
      .from('threads')
      .update({
        last_read_at: now,
        unread_count: newUnreadCount,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error || !thread) {
      logger.error('thread_mark_read_error', logContext, error)
      return NextResponse.json(
        { error: 'Failed to mark thread as read' },
        { status: 500 }
      )
    }

    logger.info('thread_marked_read', logContext, { unread_count: thread.unread_count })

    return NextResponse.json({ ok: true, thread })
  } catch (error: any) {
    logger.error('thread_mark_read_error', logContext, { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

