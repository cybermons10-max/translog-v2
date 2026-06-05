import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises dans .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function seed() {
  console.log('🌱 Début du seed...')

  // --- TENANT ---
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .upsert({ slug: 'trans-services-marchita', name: 'Trans Services Marchita', pays_desservis: ['Maroc', 'Algérie', 'Tunisie'], plan: 'starter' }, { onConflict: 'slug' })
    .select()
    .single()

  if (tenantError) { console.error('❌ Tenant:', tenantError.message); process.exit(1) }
  console.log('✅ Tenant:', tenant.name, `(${tenant.id})`)

  // --- SUPERADMIN ---
  const existingSuperadmin = await supabase.auth.admin.listUsers()
  const superadminExists = existingSuperadmin.data.users.find(u => u.email === 'cybermons10@gmail.com')

  let superadminId: string
  if (superadminExists) {
    superadminId = superadminExists.id
    await supabase.auth.admin.updateUserById(superadminId, {
      password: 'SuperAdmin2026!',
      app_metadata: { role: 'superadmin' },
    })
    console.log('✅ Superadmin mis à jour')
  } else {
    const { data: sa, error: saError } = await supabase.auth.admin.createUser({
      email: 'cybermons10@gmail.com',
      password: 'SuperAdmin2026!',
      email_confirm: true,
      app_metadata: { role: 'superadmin' },
    })
    if (saError || !sa.user) { console.error('❌ Superadmin:', saError?.message); process.exit(1) }
    superadminId = sa.user.id
    console.log('✅ Superadmin créé')
  }

  await supabase.from('profiles').upsert({ id: superadminId, tenant_id: null, role: 'superadmin' }, { onConflict: 'id' })

  // --- TENANT ADMIN ---
  const tenantAdminExists = existingSuperadmin.data.users.find(u => u.email === 'admin@transservices.fr')

  let tenantAdminId: string
  if (tenantAdminExists) {
    tenantAdminId = tenantAdminExists.id
    await supabase.auth.admin.updateUserById(tenantAdminId, {
      password: 'Test2026!',
      app_metadata: { role: 'tenant_admin', tenant_id: tenant.id, subscription_status: 'trial', trial_ends_at: tenant.trial_ends_at, plan: 'starter' },
    })
    console.log('✅ Tenant admin mis à jour')
  } else {
    const { data: ta, error: taError } = await supabase.auth.admin.createUser({
      email: 'admin@transservices.fr',
      password: 'Test2026!',
      email_confirm: true,
      app_metadata: { role: 'tenant_admin', tenant_id: tenant.id, subscription_status: 'trial', trial_ends_at: tenant.trial_ends_at, plan: 'starter' },
    })
    if (taError || !ta.user) { console.error('❌ Tenant admin:', taError?.message); process.exit(1) }
    tenantAdminId = ta.user.id
    console.log('✅ Tenant admin créé')
  }

  await supabase.from('profiles').upsert({ id: tenantAdminId, tenant_id: tenant.id, role: 'tenant_admin' }, { onConflict: 'id' })

  // --- DOSSIERS DE TEST ---
  const dossiers = [
    { tenant_id: tenant.id, reference: 'TSM-2026-0001', client_nom: 'Ahmed Benali', client_phone: '0612345678', client_email: 'ahmed@example.com', type_colis: 'electromenager', poids_kg: 45, ville_depart: 'Lille', ville_arrivee: 'Casablanca', pays_arrivee: 'Maroc', montant_ht: 280, montant_ttc: 336, statut: 'livre' },
    { tenant_id: tenant.id, reference: 'TSM-2026-0002', client_nom: 'Fatima Zahra', client_phone: '0698765432', type_colis: 'volumineux', poids_kg: 30, ville_depart: 'Paris', ville_arrivee: 'Alger', pays_arrivee: 'Algérie', montant_ht: 220, montant_ttc: 264, statut: 'en_transit' },
    { tenant_id: tenant.id, reference: 'TSM-2026-0003', client_nom: 'Mohamed Trabelsi', client_phone: '0678901234', type_colis: 'petit', poids_kg: 5, ville_depart: 'Lyon', ville_arrivee: 'Tunis', pays_arrivee: 'Tunisie', montant_ht: 80, montant_ttc: 96, statut: 'confirme' },
    { tenant_id: tenant.id, reference: 'TSM-2026-0004', client_nom: 'Nadia Bouzid', client_phone: '0655443322', type_colis: 'moyen', poids_kg: 15, ville_depart: 'Marseille', ville_arrivee: 'Oran', pays_arrivee: 'Algérie', montant_ht: 150, montant_ttc: 180, statut: 'arrive' },
    { tenant_id: tenant.id, reference: 'TSM-2026-0005', client_nom: 'Karim Lahlou', client_phone: '0633221100', client_email: null, type_colis: 'electromenager', poids_kg: 60, ville_depart: 'Roubaix', ville_arrivee: 'Rabat', pays_arrivee: 'Maroc', statut: 'recu', montant_ht: null, montant_ttc: null },
  ]

  for (const dossier of dossiers as Record<string, unknown>[]) {
    const { error } = await supabase.from('dossiers').upsert(dossier as any, { onConflict: 'tenant_id,reference' })
    if (error) console.error(`❌ Dossier ${dossier.reference}:`, error.message)
    else console.log(`✅ Dossier ${dossier.reference} (${dossier.statut})`)
  }

  console.log('\n🎉 Seed terminé !')
  console.log('   Superadmin : cybermons10@gmail.com / SuperAdmin2026!')
  console.log('   Tenant admin: admin@transservices.fr / Test2026!')
}

seed().catch(console.error)
