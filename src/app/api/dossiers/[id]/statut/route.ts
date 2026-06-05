import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendStatutUpdated, sendSmsStatutUpdated } from '@/lib/brevo'
import { notifyTenant } from '@/lib/push'
import { statutLabel } from '@/lib/utils'

export const runtime = 'nodejs'

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
    .select('id, reference, client_email, client_phone, client_nom')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (statut !== 'recu') {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name, plan, sms_enabled')
      .eq('id', tenantId)
      .single()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://translog-v2.vercel.app'
    const smsEnabled = tenant?.sms_enabled === true && ['pro', 'business'].includes(tenant?.plan ?? '')

    // Email client
    if (dossier?.client_email) {
      sendStatutUpdated({
        clientEmail: dossier.client_email,
        clientNom: dossier.client_nom,
        tenantName: tenant?.name ?? 'TransLog',
        reference: dossier.reference,
        newStatut: statut,
        appUrl,
      })
    }

    // SMS client — Pro/Business + sms_enabled
    if (smsEnabled && dossier?.client_phone) {
      sendSmsStatutUpdated({
        clientPhone: dossier.client_phone,
        clientNom: dossier.client_nom,
        reference: dossier.reference,
        newStatut: statut,
      })
    }

    // Push notification tenant_admin
    notifyTenant(tenantId, {
      title: `Dossier ${dossier?.reference}`,
      body: `Statut mis à jour : ${statutLabel(statut)}`,
      url: `${appUrl}/dashboard/dossiers/${id}`,
      tag: `statut-${id}`,
    })
  }

  return NextResponse.json({ success: true })
}
