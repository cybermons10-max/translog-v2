import type { User } from '@supabase/supabase-js'

export function isTenantAdmin(user: User): boolean {
  return user.app_metadata?.role === 'tenant_admin'
}

export function isTenantMember(user: User): boolean {
  const role = user.app_metadata?.role
  return role === 'tenant_admin' || role === 'tenant_staff'
}
