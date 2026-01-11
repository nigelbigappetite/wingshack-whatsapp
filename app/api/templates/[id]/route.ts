import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'
import { logger } from '@/src/lib/logger'
import { getOrCreateCorrelationId } from '@/src/lib/correlation'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = getOrCreateCorrelationId(request.headers)
  const logContext = { request_id: requestId, template_id: params.id }

  try {
    const body = await request.json()
    const { title, body: templateBody, category, variables_json } = body

    logger.info('template_update', logContext)

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (title !== undefined) updateData.title = title
    if (templateBody !== undefined) updateData.body = templateBody
    if (category !== undefined) updateData.category = category
    if (variables_json !== undefined) updateData.variables_json = variables_json

    const { data: template, error } = await supabaseAdmin
      .from('reply_templates')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error || !template) {
      logger.error('template_update_error', logContext, error)
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      )
    }

    logger.info('template_updated', logContext)

    return NextResponse.json({ ok: true, template })
  } catch (error: any) {
    logger.error('template_update_error', logContext, { error: error.message })
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
  const logContext = { request_id: requestId, template_id: params.id }

  try {
    logger.info('template_delete', logContext)

    const { error } = await supabaseAdmin
      .from('reply_templates')
      .delete()
      .eq('id', params.id)

    if (error) {
      logger.error('template_delete_error', logContext, error)
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      )
    }

    logger.info('template_deleted', logContext)

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    logger.error('template_delete_error', logContext, { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

