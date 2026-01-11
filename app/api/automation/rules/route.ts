import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'
import { logger } from '@/src/lib/logger'
import { getOrCreateCorrelationId } from '@/src/lib/correlation'

export async function GET() {
  const requestId = getOrCreateCorrelationId(new Headers())
  const logContext = { request_id: requestId }

  try {
    const { data: rules, error } = await supabaseAdmin
      .from('automation_rules')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('rules_fetch_error', logContext, error)
      return NextResponse.json(
        { error: 'Failed to fetch rules' },
        { status: 500 }
      )
    }

    return NextResponse.json({ rules: rules || [] })
  } catch (error: any) {
    logger.error('rules_fetch_error', logContext, { error: error.message })
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
    const { enabled, priority, match_type, match_value, actions_json } = body

    if (!match_type || !match_value || !actions_json) {
      return NextResponse.json(
        { error: 'match_type, match_value, and actions_json are required' },
        { status: 400 }
      )
    }

    if (!['contains', 'equals', 'regex', 'phone'].includes(match_type)) {
      return NextResponse.json(
        { error: 'Invalid match_type. Must be one of: contains, equals, regex, phone' },
        { status: 400 }
      )
    }

    logger.info('rule_create', logContext, { match_type, match_value })

    const { data: rule, error } = await supabaseAdmin
      .from('automation_rules')
      .insert({
        enabled: enabled !== undefined ? enabled : true,
        priority: priority || 0,
        match_type,
        match_value,
        actions_json,
      })
      .select()
      .single()

    if (error || !rule) {
      logger.error('rule_create_error', logContext, error)
      return NextResponse.json(
        { error: 'Failed to create rule' },
        { status: 500 }
      )
    }

    logger.info('rule_created', logContext, { rule_id: rule.id })

    return NextResponse.json({ ok: true, rule })
  } catch (error: any) {
    logger.error('rule_create_error', logContext, { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

