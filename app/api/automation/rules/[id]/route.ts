import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'
import { logger } from '@/src/lib/logger'
import { getOrCreateCorrelationId } from '@/src/lib/correlation'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = getOrCreateCorrelationId(request.headers)
  const logContext = { request_id: requestId, rule_id: params.id }

  try {
    const body = await request.json()
    const { enabled, priority, match_type, match_value, actions_json } = body

    logger.info('rule_update', logContext)

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (enabled !== undefined) updateData.enabled = enabled
    if (priority !== undefined) updateData.priority = priority
    if (match_type !== undefined) updateData.match_type = match_type
    if (match_value !== undefined) updateData.match_value = match_value
    if (actions_json !== undefined) updateData.actions_json = actions_json

    const { data: rule, error } = await supabaseAdmin
      .from('automation_rules')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error || !rule) {
      logger.error('rule_update_error', logContext, error)
      return NextResponse.json(
        { error: 'Failed to update rule' },
        { status: 500 }
      )
    }

    logger.info('rule_updated', logContext)

    return NextResponse.json({ ok: true, rule })
  } catch (error: any) {
    logger.error('rule_update_error', logContext, { error: error.message })
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
  const logContext = { request_id: requestId, rule_id: params.id }

  try {
    logger.info('rule_delete', logContext)

    const { error } = await supabaseAdmin
      .from('automation_rules')
      .delete()
      .eq('id', params.id)

    if (error) {
      logger.error('rule_delete_error', logContext, error)
      return NextResponse.json(
        { error: 'Failed to delete rule' },
        { status: 500 }
      )
    }

    logger.info('rule_deleted', logContext)

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    logger.error('rule_delete_error', logContext, { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

