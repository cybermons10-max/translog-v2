import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateReference } from '@/lib/utils'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const tenantId = user.app_metadata?.tenant_id
  if (!tenantId) return NextResponse.json({ error: 'Tenant manquant' }, { status: 403 })

  const body = await request.json()
  const { client_nom, client_phone, ville_arrivee } = body

  if (!client_nom || !client_phone || !ville_arrivee) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
  }

  const [{ count }, { data: tenant }] = await Promise.all([
    supabase.from('dossiers').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('tenants').select('name').eq('id', tenantId).single(),
  ])

  const reference = generateReference(tenant?.name ?? 'TLG', count ?? 0)

  const { data, error } = await supabase
    .from('dossiers')
    .insert({
      tenant_id: tenantId,
      reference,
      client_nom: body.client_nom,
      client_phone: body.client_phone,
      client_email: body.client_email || null,
      type_colis: body.type_colis ?? 'moyen',
      poids_kg: body.poids_kg ?? null,
      description: body.description || null,
      ville_depart: body.ville_depart ?? 'Lille',
      ville_arrivee: body.ville_arrivee,
      pays_arrivee: body.pays_arrivee ?? 'Maroc',
      montant_ht: body.montant_ht ?? null,
      montant_ttc: body.montant_ttc ?? null,
      notes_internes: body.notes_internes || null,
      statut: 'recu',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
