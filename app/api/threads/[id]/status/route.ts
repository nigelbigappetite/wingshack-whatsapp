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
    // Check permissions (for now, allow all - will be enforced when auth is implemented)
    // const userId = request.headers.get('x-user-id')
    // const hasPermission = await checkPermission(userId, 'update_thread_status')
    // if (!hasPermission) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    const body = await request.json()
    const { status } = body

    if (!status || !['open', 'pending', 'resolved', 'closed'].includes(status)) {
      logger.warn('thread_status_invalid', logContext, { status })
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: open, pending, resolved, closed' },
        { status: 400 }
      )
    }

    logger.info('thread_status_update', logContext, { status })

    const { data: thread, error } = await supabaseAdmin
      .from('threads')
      .update({ status })
      .eq('id', params.id)
      .select()
      .single()

    if (error || !thread) {
      logger.error('thread_status_update_error', logContext, error)
      return NextResponse.json(
        { error: 'Failed to update thread status' },
        { status: 500 }
      )
    }

    logger.info('thread_status_updated', logContext, { status: thread.status })

    return NextResponse.json({ ok: true, thread })
  } catch (error: any) {
    logger.error('thread_status_update_error', logContext, { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

