import { createAdminClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils'
import { NextResponse } from 'next/server'
import { sendWelcomeTransporteur } from '@/lib/brevo'

export async function POST(request: Request) {
  try {
    const { email, password, company_name, pays_desservis } = await request.json()

    if (!email || !password || !company_name) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // a) Créer l'utilisateur
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message ?? 'Erreur création utilisateur' }, { status: 400 })
    }

    const uid = authData.user.id

    // b) Générer le slug unique
    let slug = generateSlug(company_name)
    let slugSuffix = 1
    while (true) {
      const { data: existing } = await supabaseAdmin
        .from('tenants')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()
      if (!existing) break
      slugSuffix++
      slug = `${generateSlug(company_name)}-${slugSuffix}`
    }

    // c) Créer le tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({ slug, name: company_name, pays_desservis: pays_desservis ?? [] })
      .select()
      .single()

    if (tenantError || !tenant) {
      await supabaseAdmin.auth.admin.deleteUser(uid)
      return NextResponse.json({ error: tenantError?.message ?? 'Erreur création tenant' }, { status: 400 })
    }

    // d) Écrire le rôle + infos tenant dans app_metadata (JWT)
    await supabaseAdmin.auth.admin.updateUserById(uid, {
      app_metadata: {
        role: 'tenant_admin',
        tenant_id: tenant.id,
        subscription_status: 'trial',
        trial_ends_at: tenant.trial_ends_at,
        plan: 'starter',
      },
    })

    // e) Créer le profil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: uid, tenant_id: tenant.id, role: 'tenant_admin' })

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(uid)
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    // Email de bienvenue (fire-and-forget)
    try {
      sendWelcomeTransporteur({
        adminEmail: email,
        adminNom: company_name,
        tenantName: company_name,
        plan: 'starter',
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://translog-v2.vercel.app',
      })
    } catch(e) { console.error('Welcome email error:', e) }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Onboarding error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
