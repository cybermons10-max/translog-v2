import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateReference, calculateTarif } from '@/lib/utils'
import { sendDossierCreated, sendSmsNouveauDossier } from '@/lib/brevo'
import { notifyTenant } from '@/lib/push'
import { TYPE_COLIS_OPTIONS } from '@/types'
import type { Tarif } from '@/types'
import { isTenantMember } from '@/lib/auth-guards'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!isTenantMember(user)) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const tenantId = user.app_metadata?.tenant_id
  if (!tenantId) return NextResponse.json({ error: 'Tenant manquant' }, { status: 403 })

  const body = await request.json()
  const { client_nom, client_phone, ville_arrivee } = body

  if (!client_nom || !client_phone || !ville_arrivee) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
  }

  const [{ count }, { data: tenant }, { data: tarifs }] = await Promise.all([
    supabase.from('dossiers').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('tenants').select('name, plan, sms_enabled').eq('id', tenantId).single(),
    supabase.from('tarifs').select('*').eq('tenant_id', tenantId).eq('actif', true),
  ])

  const poids = body.poids_kg ? parseFloat(body.poids_kg) : null
  const prix = poids && tarifs
    ? calculateTarif(tarifs as Tarif[], body.type_colis ?? 'moyen', poids, body.pays_arrivee ?? 'Maroc')
    : null

  let data = null
  const baseCount = count ?? 0
  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = generateReference(tenant?.name ?? 'TLG', baseCount + attempt)
    const result = await supabase
      .from('dossiers')
      .insert({
        tenant_id: tenantId,
        reference,
        client_nom: body.client_nom,
        client_phone: body.client_phone,
        client_email: body.client_email || null,
        type_colis: body.type_colis ?? 'moyen',
        poids_kg: poids,
        description: body.description || null,
        ville_depart: body.ville_depart ?? 'Lille',
        ville_arrivee: body.ville_arrivee,
        pays_arrivee: body.pays_arrivee ?? 'Maroc',
        montant_ht: prix?.ht ?? null,
        montant_ttc: prix?.ttc ?? null,
        notes_internes: body.notes_internes || null,
        statut: 'recu',
      })
      .select()
      .single()

    if (!result.error) { data = result.data; break }
    if (result.error.code !== '23505') {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }
  }

  if (!data) return NextResponse.json({ error: 'Impossible de générer une référence unique. Réessayez.' }, { status: 409 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://translog-v2.vercel.app'
  const smsEnabled = tenant?.sms_enabled === true && ['pro', 'business'].includes(tenant?.plan ?? '')

  // Email client (fire-and-forget)
  if (data.client_email) {
    const typeLabel = TYPE_COLIS_OPTIONS.find(o => o.value === data.type_colis)?.label ?? data.type_colis
    sendDossierCreated({
      clientEmail: data.client_email,
      clientNom: data.client_nom,
      tenantName: tenant?.name ?? 'TransLog',
      reference: data.reference,
      typeColisLabel: typeLabel,
      villeDepart: data.ville_depart,
      villeArrivee: data.ville_arrivee,
      paysArrivee: data.pays_arrivee,
      appUrl,
    })
  }

  // SMS client — Plan Pro/Business + sms_enabled (fire-and-forget)
  if (smsEnabled) {
    sendSmsNouveauDossier({
      clientPhone: data.client_phone,
      clientNom: data.client_nom,
      reference: data.reference,
      villeArrivee: data.ville_arrivee,
      paysArrivee: data.pays_arrivee,
      appUrl,
    })
  }

  // Push notification tenant_admin (fire-and-forget)
  notifyTenant(tenantId, {
    title: 'Nouveau dossier',
    body: `${data.reference} — ${data.client_nom} → ${data.ville_arrivee}`,
    url: `${appUrl}/dashboard/dossiers/${data.id}`,
    tag: 'nouveau-dossier',
  })

  return NextResponse.json(data, { status: 201 })
}
