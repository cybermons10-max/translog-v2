import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Route publique — utilise le service_role pour bypasser RLS
// Ne retourne que les champs publics (pas notes_internes, montant, email, phone)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ref = searchParams.get('ref')?.trim().toUpperCase()

  if (!ref) return NextResponse.json({ error: 'Référence manquante' }, { status: 400 })

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('dossiers')
    .select(`
      reference,
      client_nom,
      type_colis,
      poids_kg,
      ville_depart,
      ville_arrivee,
      pays_arrivee,
      statut,
      created_at,
      updated_at,
      tenant:tenant_id ( name )
    `)
    .eq('reference', ref)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  return NextResponse.json(data)
}
