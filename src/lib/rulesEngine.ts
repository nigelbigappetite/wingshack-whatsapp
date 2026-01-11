import { supabaseAdmin } from './supabaseAdmin'
import { logger } from './logger'

export interface RuleAction {
  apply_tag?: string
  set_status?: 'open' | 'pending' | 'resolved' | 'closed'
  assign_to?: string
  auto_reply_template_id?: string
  after_hours_reply?: boolean
}

export interface Rule {
  id: string
  enabled: boolean
  priority: number
  match_type: 'contains' | 'equals' | 'regex' | 'phone'
  match_value: string
  actions_json: RuleAction
}

export interface RuleContext {
  messageBody: string
  phoneNumber: string
  threadId: string
  threadStatus?: string
}

export async function evaluateRules(context: RuleContext): Promise<Rule[]> {
  // Fetch enabled rules ordered by priority
  const { data: rules, error } = await supabaseAdmin
    .from('automation_rules')
    .select('*')
    .eq('enabled', true)
    .order('priority', { ascending: false })

  if (error || !rules) {
    logger.error('rules_fetch_error', {}, error)
    return []
  }

  const matchedRules: Rule[] = []

  for (const rule of rules) {
    if (matchesRule(rule, context)) {
      matchedRules.push(rule)
    }
  }

  return matchedRules
}

function matchesRule(rule: Rule, context: RuleContext): boolean {
  switch (rule.match_type) {
    case 'contains':
      return context.messageBody.toLowerCase().includes(rule.match_value.toLowerCase())
    case 'equals':
      return context.messageBody.toLowerCase() === rule.match_value.toLowerCase()
    case 'regex':
      try {
        const regex = new RegExp(rule.match_value, 'i')
        return regex.test(context.messageBody)
      } catch (error) {
        logger.warn('invalid_regex', { rule_id: rule.id }, { regex: rule.match_value, error })
        return false
      }
    case 'phone':
      return context.phoneNumber === rule.match_value || context.phoneNumber.endsWith(rule.match_value)
    default:
      return false
  }
}

export async function applyRuleActions(
  rule: Rule,
  context: RuleContext,
  logContext: Record<string, any>
): Promise<void> {
  const actions = rule.actions_json

  logger.info('applying_rule_actions', { ...logContext, rule_id: rule.id }, actions)

  // Apply tag
  if (actions.apply_tag) {
    const { error } = await supabaseAdmin
      .from('thread_tags')
      .insert({
        thread_id: context.threadId,
        tag_id: actions.apply_tag,
      })
      .select()
      .single()

    if (error && error.code !== '23505') {
      // Ignore duplicate tag errors
      logger.warn('rule_action_error', { ...logContext, rule_id: rule.id }, { action: 'apply_tag', error })
    }
  }

  // Set status
  if (actions.set_status) {
    const { error } = await supabaseAdmin
      .from('threads')
      .update({ status: actions.set_status })
      .eq('id', context.threadId)

    if (error) {
      logger.warn('rule_action_error', { ...logContext, rule_id: rule.id }, { action: 'set_status', error })
    }
  }

  // Assign to user
  if (actions.assign_to) {
    const { error } = await supabaseAdmin
      .from('threads')
      .update({ assigned_to: actions.assign_to })
      .eq('id', context.threadId)

    if (error) {
      logger.warn('rule_action_error', { ...logContext, rule_id: rule.id }, { action: 'assign_to', error })
    }
  }

  // Auto-reply (handled separately with guardrails)
  if (actions.auto_reply_template_id) {
    // This will be handled by the auto-reply system with cooldown checks
    logger.info('rule_auto_reply_triggered', { ...logContext, rule_id: rule.id }, {
      template_id: actions.auto_reply_template_id,
    })
  }
}

export async function canAutoReply(
  threadId: string,
  cooldownSeconds: number = 300
): Promise<boolean> {
  // Check if thread is closed
  const { data: thread } = await supabaseAdmin
    .from('threads')
    .select('status')
    .eq('id', threadId)
    .single()

  if (thread?.status === 'closed') {
    logger.debug('auto_reply_blocked', { thread_id: threadId }, { reason: 'thread_closed' })
    return false
  }

  // Check last outbound message timestamp
  const { data: lastOutbound } = await supabaseAdmin
    .from('messages')
    .select('created_at')
    .eq('thread_id', threadId)
    .eq('direction', 'out')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!lastOutbound) {
    // No previous outbound messages, allow auto-reply
    return true
  }

  const lastOutboundTime = new Date(lastOutbound.created_at).getTime()
  const now = Date.now()
  const timeSinceLastOutbound = (now - lastOutboundTime) / 1000 // seconds

  if (timeSinceLastOutbound < cooldownSeconds) {
    logger.debug('auto_reply_blocked', { thread_id: threadId }, {
      reason: 'cooldown',
      seconds_since_last: timeSinceLastOutbound,
      cooldown_seconds: cooldownSeconds,
    })
    return false
  }

  return true
}

export async function sendAutoReply(
  threadId: string,
  templateId: string,
  logContext: Record<string, any>
): Promise<void> {
  // Fetch template
  const { data: template, error: templateError } = await supabaseAdmin
    .from('reply_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (templateError || !template) {
    logger.error('auto_reply_template_error', logContext, { template_id: templateId, error: templateError })
    return
  }

  // Render template (get contact info from thread)
  const { data: thread } = await supabaseAdmin
    .from('threads')
    .select('contact_id, contacts!inner(phone_e164)')
    .eq('id', threadId)
    .single()

  if (!thread) {
    logger.error('auto_reply_thread_error', logContext, { thread_id: threadId })
    return
  }

  const contact = Array.isArray(thread.contacts) ? thread.contacts[0] : thread.contacts
  const renderedBody = template.body // TODO: Use template renderer with variables

  // Create outbound message via the send API
  // We'll call the send handler logic directly
  const { data: message, error: messageError } = await supabaseAdmin
    .from('messages')
    .insert({
      thread_id: threadId,
      direction: 'out',
      body: renderedBody,
      status: 'queued',
      is_automated: true,
    })
    .select()
    .single()

  if (messageError || !message) {
    logger.error('auto_reply_message_error', logContext, messageError)
    return
  }

  // Create outbox job
  const { error: jobError } = await supabaseAdmin
    .from('outbox_jobs')
    .insert({
      message_id: message.id,
      to_phone_e164: contact.phone_e164,
      body: renderedBody,
      status: 'queued',
    })

  if (jobError) {
    logger.error('auto_reply_job_error', logContext, jobError)
  } else {
    logger.info('auto_reply_sent', logContext, { message_id: message.id, template_id: templateId })
  }
}

