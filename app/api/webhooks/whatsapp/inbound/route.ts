import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'
import { normalizePhone } from '@/src/lib/utils'
import { updateLastWebhookTime } from '@/app/api/health/route'
import { getOrCreateCorrelationId } from '@/src/lib/correlation'
import { logger } from '@/src/lib/logger'
import * as Sentry from '@sentry/nextjs'

interface InboundWebhookPayload {
  from_phone_e164: string
  body: string
  wa_message_id?: string // Legacy field name, maps to provider_message_id
  provider_message_id?: string // Preferred field name
  timestamp?: string
}

export async function POST(request: NextRequest) {
  // Generate correlation ID for this request
  const requestId = getOrCreateCorrelationId(request.headers)
  const logContext = { request_id: requestId }

  try {
    logger.info('webhook_received', logContext, { endpoint: '/api/webhooks/whatsapp/inbound' })

    // Authenticate webhook request
    const webhookSecret = request.headers.get('x-webhook-secret')
    const expectedSecret = process.env.WHATSAPP_WEBHOOK_SECRET

    if (!expectedSecret) {
      logger.error('webhook_auth_error', logContext, { error: 'WHATSAPP_WEBHOOK_SECRET not set' })
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (!webhookSecret || webhookSecret !== expectedSecret) {
      logger.warn('webhook_unauthorized', logContext)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: InboundWebhookPayload = await request.json()
    logger.info('webhook_payload_received', logContext, { from_phone: body.from_phone_e164 })

    // Validate required fields
    if (!body.from_phone_e164) {
      logger.warn('webhook_validation_error', logContext, { error: 'Missing from_phone_e164' })
      return NextResponse.json(
        { error: 'Missing required field: from_phone_e164' },
        { status: 400 }
      )
    }

    if (!body.body) {
      logger.warn('webhook_validation_error', logContext, { error: 'Missing body' })
      return NextResponse.json(
        { error: 'Missing required field: body' },
        { status: 400 }
      )
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(body.from_phone_e164)
    logger.debug('phone_normalized', logContext, { original: body.from_phone_e164, normalized: normalizedPhone })

    // 1) Upsert contact by phone_e164
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('contacts')
      .upsert(
        { phone_e164: normalizedPhone },
        { onConflict: 'phone_e164' }
      )
      .select()
      .single()

    if (contactError) {
      logger.error('contact_upsert_error', { ...logContext, contact_id: contact?.id }, contactError)
      Sentry.captureException(contactError, {
        tags: { component: 'webhook', request_id: requestId },
        extra: { contact_id: contact?.id },
      })
      return NextResponse.json(
        { error: 'Failed to upsert contact' },
        { status: 500 }
      )
    }

    if (!contact) {
      logger.error('contact_not_found', logContext)
      return NextResponse.json(
        { error: 'Failed to create or retrieve contact' },
        { status: 500 }
      )
    }

    logger.info('contact_upserted', { ...logContext, contact_id: contact.id })

    // 2) Find or create a thread for that contact_id
    const { data: existingThread } = await supabaseAdmin
      .from('threads')
      .select('id')
      .eq('contact_id', contact.id)
      .maybeSingle()

    let threadId: string

    if (!existingThread) {
      // Thread doesn't exist, create it
      const messageTimestamp = body.timestamp ? new Date(body.timestamp) : new Date()
      const { data: newThread, error: threadCreateError } = await supabaseAdmin
        .from('threads')
        .insert({
          contact_id: contact.id,
          channel_id: channelId,
          last_message_at: messageTimestamp.toISOString(),
          last_message_preview: body.body.substring(0, 140),
        })
        .select()
        .single()

      if (threadCreateError || !newThread) {
        logger.error('thread_create_error', { ...logContext, contact_id: contact.id }, threadCreateError)
        return NextResponse.json(
          { error: 'Failed to create thread' },
          { status: 500 }
        )
      }

      threadId = newThread.id
      logger.info('thread_created', { ...logContext, thread_id: threadId, contact_id: contact.id })
    } else {
      threadId = existingThread.id
      logger.debug('thread_found', { ...logContext, thread_id: threadId, contact_id: contact.id })
    }

    // 3) Check for duplicate message (idempotency check)
    const messageTimestamp = body.timestamp ? new Date(body.timestamp) : new Date()
    const providerMessageId = body.provider_message_id || body.wa_message_id // Support both field names
    const messageContext = { ...logContext, thread_id: threadId, direction: 'in' as const, provider_message_id: providerMessageId }
    
    // If provider_message_id exists, check for duplicate
    if (providerMessageId) {
      const { data: existingMessage } = await supabaseAdmin
        .from('messages')
        .select('id, thread_id')
        .eq('provider_message_id', providerMessageId)
        .eq('direction', 'in')
        .maybeSingle()

      if (existingMessage) {
        logger.info('duplicate_message_detected', messageContext, { existing_message_id: existingMessage.id })
        // Return existing message (idempotent)
        return NextResponse.json({
          ok: true,
          thread_id: existingMessage.thread_id || threadId,
          message_id: existingMessage.id,
          request_id: requestId,
          duplicate: true,
        })
      }
    }

    // Get channel_id from thread
    const { data: threadData } = await supabaseAdmin
      .from('threads')
      .select('channel_id')
      .eq('id', threadId)
      .single()

    // 4) Insert a messages row
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        thread_id: threadId,
        channel_id: threadData?.channel_id || channelId,
        direction: 'in',
        body: body.body,
        provider_message_id: providerMessageId || null,
        status: 'received',
        created_at: messageTimestamp.toISOString(),
        request_id: requestId,
        message_type: body.message_type || 'text',
        media_url: body.media_url || null,
        mime_type: body.mime_type || null,
        file_name: body.file_name || null,
        size_bytes: body.size_bytes || null,
      })
      .select()
      .single()

    if (messageError || !message) {
      // Check if error is due to unique constraint violation (race condition)
      if (messageError?.code === '23505' || messageError?.message?.includes('unique')) {
        // Duplicate detected due to race condition, fetch existing
        if (providerMessageId) {
          const { data: existingMessage } = await supabaseAdmin
            .from('messages')
            .select('id, thread_id')
            .eq('provider_message_id', providerMessageId)
            .eq('direction', 'in')
            .maybeSingle()

          if (existingMessage) {
            logger.info('duplicate_message_race_condition', messageContext, { existing_message_id: existingMessage.id })
            return NextResponse.json({
              ok: true,
              thread_id: existingMessage.thread_id || threadId,
              message_id: existingMessage.id,
              request_id: requestId,
              duplicate: true,
            })
          }
        }
      }

      logger.error('message_insert_error', messageContext, messageError)
      Sentry.captureException(messageError || new Error('Message insert failed'), {
        tags: { component: 'webhook', request_id: requestId, thread_id: threadId },
        extra: messageContext,
      })
      return NextResponse.json(
        { error: 'Failed to insert message' },
        { status: 500 }
      )
    }

    logger.info('message_inserted', { ...messageContext, message_id: message.id })

    // 5) Evaluate automation rules and apply auto-replies
    try {
      const { evaluateRules, applyRuleActions, canAutoReply, sendAutoReply } = await import('@/src/lib/rulesEngine')
      const matchedRules = await evaluateRules({
        messageBody: body.body,
        phoneNumber: normalizedPhone,
        threadId,
      })

      for (const rule of matchedRules) {
        await applyRuleActions(rule, {
          messageBody: body.body,
          phoneNumber: normalizedPhone,
          threadId,
        }, messageContext)

        // Handle auto-reply with guardrails
        if (rule.actions_json.auto_reply_template_id) {
          const cooldownSeconds = rule.auto_reply_cooldown_seconds || 300
          const canReply = await canAutoReply(threadId, cooldownSeconds)

          if (canReply) {
            await sendAutoReply(threadId, rule.actions_json.auto_reply_template_id, messageContext)
          } else {
            logger.debug('auto_reply_skipped', messageContext, {
              rule_id: rule.id,
              reason: 'cooldown_or_closed',
            })
          }
        }
      }

      if (matchedRules.length > 0) {
        logger.info('rules_applied', messageContext, { rule_count: matchedRules.length })
      }
    } catch (error: any) {
      logger.warn('rules_evaluation_error', messageContext, { error: error.message })
      // Don't fail the webhook if rules fail
    }

    // 6) Update thread (increment unread_count for inbound messages, set SLA)
    const updateTimestamp = body.timestamp ? new Date(body.timestamp) : new Date()
    
    // Get current thread state
    const { data: currentThread } = await supabaseAdmin
      .from('threads')
      .select('unread_count, first_response_due_at')
      .eq('id', threadId)
      .single()

    const newUnreadCount = (currentThread?.unread_count || 0) + 1

    // Set first_response_due_at if not already set (SLA timer)
    // Default SLA: 1 hour (3600000 ms)
    const SLA_DURATION_MS = 3600000
    const firstResponseDueAt = currentThread?.first_response_due_at
      ? null // Already set, don't update
      : new Date(updateTimestamp.getTime() + SLA_DURATION_MS).toISOString()

    const updateData: any = {
      last_message_at: updateTimestamp.toISOString(),
      last_message_preview: body.body.substring(0, 140),
      unread_count: newUnreadCount,
    }

    if (firstResponseDueAt) {
      updateData.first_response_due_at = firstResponseDueAt
    }

    const { error: updateError } = await supabaseAdmin
      .from('threads')
      .update(updateData)
      .eq('id', threadId)

    if (updateError) {
      logger.warn('thread_update_error', { ...logContext, thread_id: threadId }, updateError)
      // Don't fail the request if thread update fails, message was already inserted
    } else {
      logger.debug('thread_updated', { ...logContext, thread_id: threadId })
    }

    // Update health tracking
    updateLastWebhookTime()

    logger.info('webhook_success', { ...logContext, thread_id: threadId, message_id: message.id })

    return NextResponse.json({
      ok: true,
      thread_id: threadId,
      message_id: message.id,
      request_id: requestId,
    })
  } catch (error: any) {
    logger.error('webhook_error', logContext, { error: error.message, stack: error.stack })
    Sentry.captureException(error, {
      tags: { component: 'webhook', request_id: requestId },
      extra: logContext,
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

