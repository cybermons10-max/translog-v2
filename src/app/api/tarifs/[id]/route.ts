import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isTenantAdmin } from '@/lib/auth-guards'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!isTenantAdmin(user)) return NextResponse.json({ error: 'Réservé à l\'administrateur' }, { status: 403 })

  const tenantId = user.app_metadata?.tenant_id
  if (!tenantId) return NextResponse.json({ error: 'Tenant manquant' }, { status: 403 })

  const { id } = await params
  const body = await request.json()

  // Whitelist des champs modifiables pour éviter l'injection de tenant_id
  const { actif, prix_base, prix_par_kg, poids_min_kg, poids_max_kg, pays_arrivee } = body
  const updates: Record<string, unknown> = {}
  if (actif !== undefined) updates.actif = actif
  if (prix_base !== undefined) updates.prix_base = prix_base
  if (prix_par_kg !== undefined) updates.prix_par_kg = prix_par_kg
  if (poids_min_kg !== undefined) updates.poids_min_kg = poids_min_kg
  if (poids_max_kg !== undefined) updates.poids_max_kg = poids_max_kg
  if (pays_arrivee !== undefined) updates.pays_arrivee = pays_arrivee

  const { error } = await supabase
    .from('tarifs')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!isTenantAdmin(user)) return NextResponse.json({ error: 'Réservé à l\'administrateur' }, { status: 403 })

  const tenantId = user.app_metadata?.tenant_id
  if (!tenantId) return NextResponse.json({ error: 'Tenant manquant' }, { status: 403 })

  const { id } = await params

  const { error } = await supabase
    .from('tarifs')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
