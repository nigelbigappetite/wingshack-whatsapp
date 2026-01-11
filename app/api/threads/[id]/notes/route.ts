import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'
import { logger } from '@/src/lib/logger'
import { getOrCreateCorrelationId } from '@/src/lib/correlation'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = getOrCreateCorrelationId(request.headers)
  const logContext = { request_id: requestId, thread_id: params.id }

  try {
    const { data: notes, error } = await supabaseAdmin
      .from('thread_notes')
      .select('*')
      .eq('thread_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('thread_notes_fetch_error', logContext, error)
      return NextResponse.json(
        { error: 'Failed to fetch notes' },
        { status: 500 }
      )
    }

    return NextResponse.json({ notes: notes || [] })
  } catch (error: any) {
    logger.error('thread_notes_fetch_error', logContext, { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = getOrCreateCorrelationId(request.headers)
  const logContext = { request_id: requestId, thread_id: params.id }

  try {
    const body = await request.json()
    const { note } = body

    if (!note || typeof note !== 'string' || note.trim().length === 0) {
      return NextResponse.json(
        { error: 'Note is required' },
        { status: 400 }
      )
    }

    logger.info('thread_note_create', logContext)

    const { data: noteRecord, error } = await supabaseAdmin
      .from('thread_notes')
      .insert({
        thread_id: params.id,
        note: note.trim(),
        created_by: null, // TODO: Get from auth when implemented
      })
      .select()
      .single()

    if (error || !noteRecord) {
      logger.error('thread_note_create_error', logContext, error)
      return NextResponse.json(
        { error: 'Failed to create note' },
        { status: 500 }
      )
    }

    logger.info('thread_note_created', logContext, { note_id: noteRecord.id })

    return NextResponse.json({ ok: true, note: noteRecord })
  } catch (error: any) {
    logger.error('thread_note_create_error', logContext, { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

