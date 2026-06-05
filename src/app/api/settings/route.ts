import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isTenantAdmin } from '@/lib/auth-guards'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!isTenantAdmin(user)) return NextResponse.json({ error: 'Réservé à l\'administrateur' }, { status: 403 })

  const tenantId = user.app_metadata?.tenant_id
  if (!tenantId) return NextResponse.json({ error: 'Tenant manquant' }, { status: 403 })

  const body = await request.json()
  const allowed = ['primary_color', 'logo_url', 'pays_desservis', 'sms_enabled']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
  }

  const { error } = await supabase.from('tenants').update(updates).eq('id', tenantId)
  if (error) {
    // Colonne sms_enabled absente = migration sprint5 non exécutée → ignorer silencieusement
    if (error.message.includes('sms_enabled')) return NextResponse.json({ success: true, warning: 'sms_migration_pending' })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// Crée le bucket Supabase Storage si absent — accessible à tout membre (utilisé au montage)
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createAdminClient()
  const { data: buckets } = await admin.storage.listBuckets()
  const exists = buckets?.some((b: { name: string }) => b.name === 'logos')

  if (!exists) {
    const { error } = await admin.storage.createBucket('logos', { public: true, fileSizeLimit: 2097152 })
    if (error && !error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
