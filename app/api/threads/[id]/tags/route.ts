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
    const { data: threadTags, error } = await supabaseAdmin
      .from('thread_tags')
      .select('tag_id, tags(*)')
      .eq('thread_id', params.id)

    if (error) {
      logger.error('thread_tags_fetch_error', logContext, error)
      return NextResponse.json(
        { error: 'Failed to fetch tags' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tags: threadTags || [] })
  } catch (error: any) {
    logger.error('thread_tags_fetch_error', logContext, { error: error.message })
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
    const { tag_id } = body

    if (!tag_id || typeof tag_id !== 'string') {
      return NextResponse.json(
        { error: 'tag_id is required' },
        { status: 400 }
      )
    }

    logger.info('thread_tag_add', logContext, { tag_id })

    const { data: threadTag, error } = await supabaseAdmin
      .from('thread_tags')
      .insert({
        thread_id: params.id,
        tag_id,
      })
      .select()
      .single()

    if (error) {
      // Ignore duplicate key errors (tag already exists)
      if (error.code === '23505') {
        logger.debug('thread_tag_already_exists', logContext, { tag_id })
        return NextResponse.json({ ok: true, duplicate: true })
      }

      logger.error('thread_tag_add_error', logContext, error)
      return NextResponse.json(
        { error: 'Failed to add tag' },
        { status: 500 }
      )
    }

    logger.info('thread_tag_added', logContext, { tag_id })

    return NextResponse.json({ ok: true, thread_tag: threadTag })
  } catch (error: any) {
    logger.error('thread_tag_add_error', logContext, { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = getOrCreateCorrelationId(request.headers)
  const logContext = { request_id: requestId, thread_id: params.id }

  try {
    const searchParams = request.nextUrl.searchParams
    const tagId = searchParams.get('tag_id')

    if (!tagId) {
      return NextResponse.json(
        { error: 'tag_id query parameter is required' },
        { status: 400 }
      )
    }

    logger.info('thread_tag_remove', logContext, { tag_id: tagId })

    const { error } = await supabaseAdmin
      .from('thread_tags')
      .delete()
      .eq('thread_id', params.id)
      .eq('tag_id', tagId)

    if (error) {
      logger.error('thread_tag_remove_error', logContext, error)
      return NextResponse.json(
        { error: 'Failed to remove tag' },
        { status: 500 }
      )
    }

    logger.info('thread_tag_removed', logContext, { tag_id: tagId })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    logger.error('thread_tag_remove_error', logContext, { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
