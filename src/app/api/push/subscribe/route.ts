import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const tenantId = user.app_metadata?.tenant_id
  if (!tenantId) return NextResponse.json({ error: 'Tenant manquant' }, { status: 403 })

  const { endpoint, keys } = await request.json()
  if (!endpoint || !keys?.auth || !keys?.p256dh) {
    return NextResponse.json({ error: 'Subscription invalide' }, { status: 400 })
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      tenant_id: tenantId,
      user_id: user.id,
      endpoint,
      auth_key: keys.auth,
      p256dh_key: keys.p256dh,
    }, { onConflict: 'user_id,endpoint' })

  if (error) {
    // La table n'existe pas encore (migration non exécutée) — no-op silencieux
    if (error.code === '42P01') return NextResponse.json({ success: true, warning: 'migration_pending' })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { endpoint } = await request.json()
  await supabase.from('push_subscriptions').delete().eq('user_id', user.id).eq('endpoint', endpoint)

  return NextResponse.json({ success: true })
}
