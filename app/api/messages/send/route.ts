import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'
import { getOrCreateCorrelationId } from '@/src/lib/correlation'
import { logger } from '@/src/lib/logger'
// Sentry temporarily disabled for simplification
// import * as Sentry from '@sentry/nextjs'
import { randomUUID } from 'crypto'
// Temporarily disabled for simplification
// import { uploadToStorage } from '@/src/lib/supabaseStorage'

interface SendMessagePayload {
  thread_id: string
  body: string
}

export async function POST(request: NextRequest) {
  // Generate correlation ID for this request
  const requestId = getOrCreateCorrelationId(request.headers)
  const logContext = { request_id: requestId }

  try {
    logger.info('send_message_request', logContext)
    
    // Simplified: JSON only, no attachments
    const body: SendMessagePayload = await request.json()

    // Validate required fields
    if (!body.thread_id) {
      logger.warn('send_validation_error', logContext, { error: 'Missing thread_id' })
      return NextResponse.json(
        { error: 'Missing required field: thread_id' },
        { status: 400 }
      )
    }

    if (!body.body) {
      logger.warn('send_validation_error', logContext, { error: 'Missing body' })
      return NextResponse.json(
        { error: 'Missing required field: body' },
        { status: 400 }
      )
    }

    const sendContext = { ...logContext, thread_id: body.thread_id, direction: 'out' as const }

    // Check permissions (for now, allow all - will be enforced when auth is implemented)
    // const userId = request.headers.get('x-user-id') // TODO: Get from auth
    // const hasPermission = await checkPermission(userId, 'send_message')
    // if (!hasPermission) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    // 1) Look up the thread and join to contact to get contact.phone_e164
    const { data: thread, error: threadError } = await supabaseAdmin
      .from('threads')
      .select('id, contact_id, channel_id')
      .eq('id', body.thread_id)
      .single()

    if (threadError || !thread) {
      logger.error('thread_fetch_error', sendContext, threadError)
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    // Fetch contact by contact_id
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('contacts')
      .select('phone_e164')
      .eq('id', thread.contact_id)
      .single()

    if (contactError || !contact || !contact.phone_e164) {
      logger.error('contact_fetch_error', { ...sendContext, contact_id: thread.contact_id }, contactError)
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    const toPhoneE164 = contact.phone_e164
    logger.debug('contact_found', { ...sendContext, contact_id: thread.contact_id, phone: toPhoneE164 })

    // 2) Generate idempotency key and check for duplicate
    const idempotencyKey = randomUUID()
    const { data: existingMessage } = await supabaseAdmin
      .from('messages')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()

    // Note: In practice, you'd want to pass idempotency_key from client for true idempotency
    // For now, we generate a new one each time, but the unique constraint on outbox_jobs.message_id
    // prevents duplicate jobs from being created

    // 3) Insert a messages row
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        thread_id: body.thread_id,
        direction: 'out',
        body: body.body,
        status: 'queued',
        request_id: requestId,
        idempotency_key: idempotencyKey,
        message_type: 'text',
        media_url: null,
        mime_type: null,
        file_name: null,
        size_bytes: null,
      })
      .select()
      .single()

    if (messageError || !message) {
      // Check if error is due to unique constraint violation
      if (messageError?.code === '23505' || messageError?.message?.includes('unique')) {
        // This shouldn't happen with UUID, but handle gracefully
        logger.warn('message_idempotency_violation', sendContext, { idempotency_key: idempotencyKey })
      }

      logger.error('message_insert_error', sendContext, messageError)
      // Sentry temporarily disabled
      // Sentry.captureException(messageError || new Error('Message insert failed'), {
      //   tags: { component: 'send_message', request_id: requestId, thread_id: body.thread_id },
      //   extra: sendContext,
      // })
      return NextResponse.json(
        { error: 'Failed to insert message' },
        { status: 500 }
      )
    }

    logger.info('message_inserted', { ...sendContext, message_id: message.id, idempotency_key: idempotencyKey })

    // 4) Insert an outbox_jobs row (unique constraint on message_id prevents duplicates)
    const { data: job, error: jobError } = await supabaseAdmin
      .from('outbox_jobs')
      .insert({
        message_id: message.id,
        channel_id: thread?.channel_id || null,
        to_phone_e164: toPhoneE164,
        body: body.body,
        status: 'queued',
        correlation_id: requestId,
        media_url: null, // Simplified: no attachments
      })
      .select()
      .single()

    if (jobError || !job) {
      // Check if error is due to unique constraint (duplicate job)
      if (jobError?.code === '23505' || jobError?.message?.includes('unique')) {
        // Job already exists for this message (idempotent)
        logger.info('job_already_exists', { ...sendContext, message_id: message.id }, { idempotency_key: idempotencyKey })
        // Fetch existing job
        const { data: existingJob } = await supabaseAdmin
          .from('outbox_jobs')
          .select('id')
          .eq('message_id', message.id)
          .maybeSingle()
        
        if (existingJob) {
          return NextResponse.json({
            ok: true,
            message_id: message.id,
            job_id: existingJob.id,
            request_id: requestId,
            duplicate: true,
          })
        }
      }

      logger.warn('job_insert_error', { ...sendContext, message_id: message.id }, jobError)
      // Don't fail the request if job insertion fails, message was already inserted
      // But we should still update the thread
    } else {
      logger.info('job_created', { ...sendContext, message_id: message.id, job_id: job.id })
    }

    // Update thread's last_message_at and last_message_preview
    // Clear first_response_due_at if this is the first outbound message (SLA met)
    const now = new Date()
    
    // Check if this is the first outbound message for this thread
    const { data: existingOutbound } = await supabaseAdmin
      .from('messages')
      .select('id')
      .eq('thread_id', body.thread_id)
      .eq('direction', 'out')
      .limit(1)
      .maybeSingle()

    const updateData: any = {
      last_message_at: now.toISOString(),
      last_message_preview: body.body.substring(0, 140),
    }

    // If this is the first outbound, clear first_response_due_at and set follow_up_due_at
    if (!existingOutbound) {
      updateData.first_response_due_at = null
      // Set follow-up SLA (e.g., 24 hours)
      const FOLLOW_UP_DURATION_MS = 86400000 // 24 hours
      updateData.follow_up_due_at = new Date(now.getTime() + FOLLOW_UP_DURATION_MS).toISOString()
    }

    const { error: updateError } = await supabaseAdmin
      .from('threads')
      .update(updateData)
      .eq('id', body.thread_id)

    if (updateError) {
      logger.warn('thread_update_error', sendContext, updateError)
      // Don't fail the request if thread update fails
    } else {
      logger.debug('thread_updated', sendContext)
    }

    logger.info('send_message_success', { ...sendContext, message_id: message.id, job_id: job?.id })

    return NextResponse.json({
      ok: true,
      message_id: message.id,
      job_id: job?.id || null,
      request_id: requestId,
    })
  } catch (error: any) {
    logger.error('send_message_error', logContext, { error: error.message, stack: error.stack })
    // Sentry temporarily disabled
    // Sentry.captureException(error, {
    //   tags: { component: 'send_message', request_id: requestId },
    //   extra: logContext,
    // })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

