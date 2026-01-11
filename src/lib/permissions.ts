import { supabaseAdmin } from './supabaseAdmin'
import { logger } from './logger'

export type UserRole = 'admin' | 'agent' | 'viewer'

export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const { data: userRole, error } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !userRole) {
      logger.debug('user_role_not_found', { user_id: userId })
      return null
    }

    return userRole.role as UserRole
  } catch (error: any) {
    logger.error('get_user_role_error', { user_id: userId }, { error: error.message })
    return null
  }
}

export function canPerformAction(role: UserRole | null, action: string): boolean {
  if (!role) {
    return false // No role = no access
  }

  switch (action) {
    case 'send_message':
    case 'update_thread_status':
    case 'assign_thread':
    case 'add_note':
    case 'add_tag':
      return role === 'admin' || role === 'agent'

    case 'export_data':
    case 'manage_rules':
    case 'manage_templates':
    case 'manage_tags':
      return role === 'admin'

    case 'view_threads':
    case 'view_messages':
    case 'view_analytics':
      return role === 'admin' || role === 'agent' || role === 'viewer'

    default:
      return false
  }
}

export async function checkPermission(
  userId: string | null,
  action: string
): Promise<boolean> {
  if (!userId) {
    return false
  }

  const role = await getUserRole(userId)
  return canPerformAction(role, action)
}

