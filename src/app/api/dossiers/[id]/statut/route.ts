import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendStatutUpdated } from '@/lib/brevo'

const VALID_STATUTS = ['recu', 'confirme', 'en_transit', 'arrive', 'livre', 'annule']

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const tenantId = user.app_metadata?.tenant_id
  if (!tenantId) return NextResponse.json({ error: 'Tenant manquant' }, { status: 403 })

  const { id } = await params
  const { statut } = await request.json()

  if (!VALID_STATUTS.includes(statut)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
  }

  const { data: dossier, error } = await supabase
    .from('dossiers')
    .update({ statut })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('reference, client_email, client_nom')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Email au client si statut significatif (pas 'recu')
  if (dossier?.client_email && statut !== 'recu') {
    const { data: tenant } = await supabase.from('tenants').select('name').eq('id', tenantId).single()
    sendStatutUpdated({
      clientEmail: dossier.client_email,
      clientNom: dossier.client_nom,
      tenantName: tenant?.name ?? 'TransLog',
      reference: dossier.reference,
      newStatut: statut,
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://translog-v2.vercel.app',
    })
  }

  return NextResponse.json({ success: true })
}
