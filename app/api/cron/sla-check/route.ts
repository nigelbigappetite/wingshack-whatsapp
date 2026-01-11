import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'
import { logger } from '@/src/lib/logger'
import { getOrCreateCorrelationId } from '@/src/lib/correlation'

// This endpoint should be called by Vercel Cron or a scheduled task
export async function GET(request: NextRequest) {
  const requestId = getOrCreateCorrelationId(request.headers)
  const logContext = { request_id: requestId }

  // Verify cron secret if needed
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    logger.info('sla_check_started', logContext)

    const now = new Date().toISOString()

    // Find threads with breached SLAs
    const { data: breachedThreads, error: queryError } = await supabaseAdmin
      .from('threads')
      .select('id, first_response_due_at, follow_up_due_at, sla_breached_at')
      .or(`first_response_due_at.lt.${now},follow_up_due_at.lt.${now}`)
      .is('sla_breached_at', null) // Only update threads that haven't been marked as breached yet

    if (queryError) {
      logger.error('sla_check_query_error', logContext, queryError)
      return NextResponse.json(
        { error: 'Failed to query threads' },
        { status: 500 }
      )
    }

    if (!breachedThreads || breachedThreads.length === 0) {
      logger.info('sla_check_no_breaches', logContext)
      return NextResponse.json({ ok: true, breached_count: 0 })
    }

    // Update breached threads
    const threadIds = breachedThreads.map((t) => t.id)
    const { error: updateError } = await supabaseAdmin
      .from('threads')
      .update({ sla_breached_at: now })
      .in('id', threadIds)

    if (updateError) {
      logger.error('sla_check_update_error', logContext, updateError)
      return NextResponse.json(
        { error: 'Failed to update breached threads' },
        { status: 500 }
      )
    }

    logger.info('sla_check_completed', logContext, { breached_count: breachedThreads.length })

    return NextResponse.json({
      ok: true,
      breached_count: breachedThreads.length,
      thread_ids: threadIds,
    })
  } catch (error: any) {
    logger.error('sla_check_error', logContext, { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

