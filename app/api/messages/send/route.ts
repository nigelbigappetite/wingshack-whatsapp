import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'

interface SendMessagePayload {
  thread_id: string
  body: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SendMessagePayload = await request.json()

    // Validate required fields
    if (!body.thread_id) {
      return NextResponse.json(
        { error: 'Missing required field: thread_id' },
        { status: 400 }
      )
    }

    if (!body.body) {
      return NextResponse.json(
        { error: 'Missing required field: body' },
        { status: 400 }
      )
    }

    // 1) Look up the thread and join to contact to get contact.phone_e164
    const { data: thread, error: threadError } = await supabaseAdmin
      .from('threads')
      .select('id, contact_id')
      .eq('id', body.thread_id)
      .single()

    if (threadError || !thread) {
      console.error('Error fetching thread:', threadError)
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
      console.error('Error fetching contact:', contactError)
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    const toPhoneE164 = contact.phone_e164

    // 2) Insert a messages row
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        thread_id: body.thread_id,
        direction: 'out',
        body: body.body,
        status: 'queued',
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

    // 3) Insert an outbox_jobs row
    const { data: job, error: jobError } = await supabaseAdmin
      .from('outbox_jobs')
      .insert({
        message_id: message.id,
        to_phone_e164: toPhoneE164,
        body: body.body,
        status: 'queued',
      })
      .select()
      .single()

    if (jobError || !job) {
      console.error('Error inserting outbox job:', jobError)
      // Don't fail the request if job insertion fails, message was already inserted
      // But we should still update the thread
    }

    // Update thread's last_message_at and last_message_preview
    const now = new Date()
    const { error: updateError } = await supabaseAdmin
      .from('threads')
      .update({
        last_message_at: now.toISOString(),
        last_message_preview: body.body.substring(0, 140),
      })
      .eq('id', body.thread_id)

    if (updateError) {
      console.error('Error updating thread:', updateError)
      // Don't fail the request if thread update fails
    }

    return NextResponse.json({
      ok: true,
      message_id: message.id,
      job_id: job?.id || null,
    })
  } catch (error) {
    console.error('Error processing send message request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

