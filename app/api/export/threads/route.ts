import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'
import { logger } from '@/src/lib/logger'
import { getOrCreateCorrelationId } from '@/src/lib/correlation'

export async function GET(request: NextRequest) {
  const requestId = getOrCreateCorrelationId(request.headers)
  const logContext = { request_id: requestId }

  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const status = searchParams.get('status')
    const tagId = searchParams.get('tag_id')
    const assignedTo = searchParams.get('assigned_to')

    logger.info('export_threads', logContext, { startDate, endDate, status, tagId, assignedTo })

    // Build query
    let query = supabaseAdmin
      .from('threads')
      .select(`
        id,
        contact_id,
        status,
        assigned_to,
        created_at,
        last_message_at,
        contacts!inner(phone_e164)
      `)

    // Apply filters
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
    }

    // Filter by tag if provided
    if (tagId) {
      const { data: taggedThreads } = await supabaseAdmin
        .from('thread_tags')
        .select('thread_id')
        .eq('tag_id', tagId)

      if (taggedThreads && taggedThreads.length > 0) {
        const threadIds = taggedThreads.map((t) => t.thread_id)
        query = query.in('id', threadIds)
      } else {
        // No threads with this tag, return empty CSV
        return new NextResponse('thread_id,contact_phone,status,message_count,first_response_time,created_at\n', {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="threads.csv"',
          },
        })
      }
    }

    const { data: threads, error } = await query.order('created_at', { ascending: false })

    if (error) {
      logger.error('export_threads_error', logContext, error)
      return NextResponse.json(
        { error: 'Failed to fetch threads' },
        { status: 500 }
      )
    }

    // Get message counts and first response times for each thread
    const threadIds = threads?.map((t) => t.id) || []
    const { data: threadMetrics } = await supabaseAdmin
      .from('thread_metrics')
      .select('id, inbound_count, outbound_count, first_response_seconds')
      .in('id', threadIds)

    const metricsMap = new Map(
      threadMetrics?.map((m: any) => [
        m.id,
        {
          messageCount: (m.inbound_count || 0) + (m.outbound_count || 0),
          firstResponseTime: m.first_response_seconds
            ? `${Math.round(m.first_response_seconds / 60)}m`
            : 'N/A',
        },
      ]) || []
    )

    // Generate CSV
    const csvHeader = 'thread_id,contact_phone,status,message_count,first_response_time,created_at\n'
    const csvRows = threads
      ?.map((thread: any) => {
        const contact = Array.isArray(thread.contacts) ? thread.contacts[0] : thread.contacts
        const phone = contact?.phone_e164 || 'Unknown'
        const metrics = metricsMap.get(thread.id) || { messageCount: 0, firstResponseTime: 'N/A' }
        const createdAt = new Date(thread.created_at).toISOString()

        return `${thread.id},${phone},${thread.status || 'open'},${metrics.messageCount},${metrics.firstResponseTime},${createdAt}`
      })
      .join('\n') || ''

    const csv = csvHeader + csvRows

    logger.info('export_threads_success', logContext, { thread_count: threads?.length || 0 })

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="threads.csv"',
      },
    })
  } catch (error: any) {
    logger.error('export_threads_error', logContext, { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

