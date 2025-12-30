import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'
import { normalizePhone } from '@/src/lib/utils'

interface InboundWebhookPayload {
  from_phone_e164: string
  body: string
  wa_message_id?: string
  timestamp?: string
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate webhook request
    const webhookSecret = request.headers.get('x-webhook-secret')
    const expectedSecret = process.env.WHATSAPP_WEBHOOK_SECRET

    if (!expectedSecret) {
      console.error('WHATSAPP_WEBHOOK_SECRET environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (!webhookSecret || webhookSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: InboundWebhookPayload = await request.json()

    // Validate required fields
    if (!body.from_phone_e164) {
      return NextResponse.json(
        { error: 'Missing required field: from_phone_e164' },
        { status: 400 }
      )
    }

    if (!body.body) {
      return NextResponse.json(
        { error: 'Missing required field: body' },
        { status: 400 }
      )
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(body.from_phone_e164)

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
      console.error('Error upserting contact:', contactError)
      return NextResponse.json(
        { error: 'Failed to upsert contact' },
        { status: 500 }
      )
    }

    if (!contact) {
      return NextResponse.json(
        { error: 'Failed to create or retrieve contact' },
        { status: 500 }
      )
    }

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
          last_message_at: messageTimestamp.toISOString(),
          last_message_preview: body.body.substring(0, 140),
        })
        .select()
        .single()

      if (threadCreateError || !newThread) {
        console.error('Error creating thread:', threadCreateError)
        return NextResponse.json(
          { error: 'Failed to create thread' },
          { status: 500 }
        )
      }

      threadId = newThread.id
    } else {
      threadId = existingThread.id
    }

    // 3) Insert a messages row
    const messageTimestamp = body.timestamp ? new Date(body.timestamp) : new Date()
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        thread_id: threadId,
        direction: 'in',
        body: body.body,
        wa_message_id: body.wa_message_id || null,
        status: 'received',
        created_at: messageTimestamp.toISOString(),
      })
      .select()
      .single()

    if (messageError || !message) {
      console.error('Error inserting message:', messageError)
      return NextResponse.json(
        { error: 'Failed to insert message' },
        { status: 500 }
      )
    }

    // 4) Update thread
    const updateTimestamp = body.timestamp ? new Date(body.timestamp) : new Date()
    const { error: updateError } = await supabaseAdmin
      .from('threads')
      .update({
        last_message_at: updateTimestamp.toISOString(),
        last_message_preview: body.body.substring(0, 140),
      })
      .eq('id', threadId)

    if (updateError) {
      console.error('Error updating thread:', updateError)
      // Don't fail the request if thread update fails, message was already inserted
    }

    return NextResponse.json({
      ok: true,
      thread_id: threadId,
      message_id: message.id,
    })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

