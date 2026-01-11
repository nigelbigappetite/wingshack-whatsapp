import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'
import { logger } from '@/src/lib/logger'
import { getOrCreateCorrelationId } from '@/src/lib/correlation'

export async function GET() {
  const requestId = getOrCreateCorrelationId(new Headers())
  const logContext = { request_id: requestId }

  try {
    const { data: tags, error } = await supabaseAdmin
      .from('tags')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      logger.error('tags_fetch_error', logContext, error)
      return NextResponse.json(
        { error: 'Failed to fetch tags' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tags: tags || [] })
  } catch (error: any) {
    logger.error('tags_fetch_error', logContext, { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const requestId = getOrCreateCorrelationId(request.headers)
  const logContext = { request_id: requestId }

  try {
    const body = await request.json()
    const { name, color } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      )
    }

    logger.info('tag_create', logContext, { name })

    const { data: tag, error } = await supabaseAdmin
      .from('tags')
      .insert({
        name: name.trim(),
        color: color || null,
      })
      .select()
      .single()

    if (error || !tag) {
      logger.error('tag_create_error', logContext, error)
      return NextResponse.json(
        { error: 'Failed to create tag' },
        { status: 500 }
      )
    }

    logger.info('tag_created', logContext, { tag_id: tag.id })

    return NextResponse.json({ ok: true, tag })
  } catch (error: any) {
    logger.error('tag_create_error', logContext, { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

