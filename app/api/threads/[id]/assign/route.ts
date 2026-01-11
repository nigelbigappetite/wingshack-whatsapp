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
    const body = await request.json()
    const { assigned_to } = body

    // assigned_to can be null (unassign)
    if (assigned_to !== null && assigned_to !== undefined && typeof assigned_to !== 'string') {
      logger.warn('thread_assign_invalid', logContext, { assigned_to })
      return NextResponse.json(
        { error: 'Invalid assigned_to. Must be a UUID or null' },
        { status: 400 }
      )
    }

    logger.info('thread_assign', logContext, { assigned_to })

    const { data: thread, error } = await supabaseAdmin
      .from('threads')
      .update({ assigned_to })
      .eq('id', params.id)
      .select()
      .single()

    if (error || !thread) {
      logger.error('thread_assign_error', logContext, error)
      return NextResponse.json(
        { error: 'Failed to assign thread' },
        { status: 500 }
      )
    }

    logger.info('thread_assigned', logContext, { assigned_to: thread.assigned_to })

    return NextResponse.json({ ok: true, thread })
  } catch (error: any) {
    logger.error('thread_assign_error', logContext, { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

