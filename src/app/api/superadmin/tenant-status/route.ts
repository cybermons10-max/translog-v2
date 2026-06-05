import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { tenantId, status } = await request.json()

  if (!tenantId || !['active', 'suspended', 'cancelled'].includes(status)) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('tenants')
    .update({ subscription_status: status })
    .eq('id', tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sync app_metadata en préservant tous les champs existants (role, tenant_id, plan…)
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id')
    .eq('tenant_id', tenantId)

  if (profiles) {
    await Promise.all(
      profiles.map(async (p: { id: string }) => {
        const { data: { user: u } } = await adminClient.auth.admin.getUserById(p.id)
        const existing = u?.app_metadata ?? {}
        return adminClient.auth.admin.updateUserById(p.id, {
          app_metadata: { ...existing, subscription_status: status },
        })
      })
    )
  }

  return NextResponse.json({ success: true })
}
