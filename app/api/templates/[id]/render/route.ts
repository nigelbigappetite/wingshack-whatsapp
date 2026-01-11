import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'
import { logger } from '@/src/lib/logger'
import { getOrCreateCorrelationId } from '@/src/lib/correlation'
import { renderTemplate } from '@/src/lib/templateRenderer'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = getOrCreateCorrelationId(request.headers)
  const logContext = { request_id: requestId, template_id: params.id }

  try {
    const body = await request.json()
    const { variables, thread_id } = body

    // Fetch template
    const { data: template, error: templateError } = await supabaseAdmin
      .from('reply_templates')
      .select('*')
      .eq('id', params.id)
      .single()

    if (templateError || !template) {
      logger.error('template_fetch_error', logContext, templateError)
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // If thread_id provided, fetch contact info
    let contactName: string | undefined
    let contactPhone: string | undefined

    if (thread_id) {
      const { data: thread } = await supabaseAdmin
        .from('threads')
        .select('contact_id, contacts!inner(phone_e164)')
        .eq('id', thread_id)
        .single()

      if (thread) {
        const contact = Array.isArray(thread.contacts) ? thread.contacts[0] : thread.contacts
        contactPhone = contact?.phone_e164
        // TODO: Add name field to contacts table if needed
      }
    }

    // Merge variables
    const templateVariables = {
      name: variables?.name || contactName || '',
      phone: variables?.phone || contactPhone || '',
      order_id: variables?.order_id || '',
      thread_id: thread_id || '',
      ...variables,
    }

    // Render template
    const rendered = renderTemplate(template.body, templateVariables)

    logger.info('template_rendered', logContext)

    return NextResponse.json({ rendered })
  } catch (error: any) {
    logger.error('template_render_error', logContext, { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

