import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'
import { logger } from '@/src/lib/logger'
import { getOrCreateCorrelationId } from '@/src/lib/correlation'

export async function GET(request: NextRequest) {
  const requestId = getOrCreateCorrelationId(request.headers)
  const logContext = { request_id: requestId }

  try {
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q') || ''
    const status = searchParams.get('status')
    const assignedTo = searchParams.get('assigned_to')
    const unread = searchParams.get('unread') === 'true'

    logger.info('thread_search', logContext, { q, status, assignedTo, unread })

    let query = supabaseAdmin
      .from('threads')
      .select(`
        id,
        contact_id,
        last_message_at,
        last_message_preview,
        status,
        unread_count,
        assigned_to,
        contacts!inner(phone_e164)
      `)

    // Search by phone number (exact match or partial)
    if (q) {
      // Try exact phone match first
      const phoneQuery = supabaseAdmin
        .from('contacts')
        .select('id')
        .ilike('phone_e164', `%${q}%`)

      const { data: matchingContacts } = await phoneQuery

      if (matchingContacts && matchingContacts.length > 0) {
        const contactIds = matchingContacts.map(c => c.id)
        query = query.in('contact_id', contactIds)
      } else {
        // If no phone match, search in message content
        const messageQuery = supabaseAdmin
          .from('messages')
          .select('thread_id')
          .ilike('body', `%${q}%`)
          .limit(100)

        const { data: matchingMessages } = await messageQuery

        if (matchingMessages && matchingMessages.length > 0) {
          const threadIds = Array.from(new Set(matchingMessages.map(m => m.thread_id)))
          query = query.in('id', threadIds)
        } else {
          // No matches, return empty
          return NextResponse.json({ threads: [] })
        }
      }
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status)
    }

    // Filter by assigned_to
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
    }

    // Filter by unread
    if (unread) {
      query = query.gt('unread_count', 0)
    }

    // Order by last_message_at desc
    query = query.order('last_message_at', { ascending: false })

    const { data: threads, error } = await query

    if (error) {
      logger.error('thread_search_error', logContext, error)
      return NextResponse.json(
        { error: 'Failed to search threads' },
        { status: 500 }
      )
    }

    logger.info('thread_search_success', logContext, { count: threads?.length || 0 })

    return NextResponse.json({ threads: threads || [] })
  } catch (error: any) {
    logger.error('thread_search_error', logContext, { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

