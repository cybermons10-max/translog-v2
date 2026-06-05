import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isTenantAdmin } from '@/lib/auth-guards'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!isTenantAdmin(user)) return NextResponse.json({ error: 'Réservé à l\'administrateur' }, { status: 403 })

  const tenantId = user.app_metadata?.tenant_id
  if (!tenantId) return NextResponse.json({ error: 'Tenant manquant' }, { status: 403 })

  const body = await request.json()

  const { data, error } = await supabase
    .from('tarifs')
    .insert({
      tenant_id: tenantId,
      type_colis: body.type_colis,
      poids_min_kg: body.poids_min_kg ?? 0,
      poids_max_kg: body.poids_max_kg ?? null,
      prix_base: body.prix_base,
      prix_par_kg: body.prix_par_kg ?? 0,
      pays_arrivee: body.pays_arrivee ?? null,
      actif: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
