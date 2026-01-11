import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'
import { logger } from '@/src/lib/logger'
import { getOrCreateCorrelationId } from '@/src/lib/correlation'

export async function GET() {
  const requestId = getOrCreateCorrelationId(new Headers())
  const logContext = { request_id: requestId }

  try {
    const { data: templates, error } = await supabaseAdmin
      .from('reply_templates')
      .select('*')
      .order('category', { ascending: true })
      .order('title', { ascending: true })

    if (error) {
      logger.error('templates_fetch_error', logContext, error)
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error: any) {
    logger.error('templates_fetch_error', logContext, { error: error.message })
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
    const { title, body: templateBody, category, variables_json } = body

    if (!title || !templateBody) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      )
    }

    logger.info('template_create', logContext, { title })

    const { data: template, error } = await supabaseAdmin
      .from('reply_templates')
      .insert({
        title,
        body: templateBody,
        category: category || null,
        variables_json: variables_json || {},
      })
      .select()
      .single()

    if (error || !template) {
      logger.error('template_create_error', logContext, error)
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      )
    }

    logger.info('template_created', logContext, { template_id: template.id })

    return NextResponse.json({ ok: true, template })
  } catch (error: any) {
    logger.error('template_create_error', logContext, { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

