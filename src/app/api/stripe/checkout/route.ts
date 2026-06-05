import { stripe, PLANS } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { PlanKey } from '@/lib/stripe'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const tenantId = user.app_metadata?.tenant_id
  if (!tenantId) return NextResponse.json({ error: 'Tenant manquant' }, { status: 403 })

  const { plan = 'starter' }: { plan: PlanKey } = await request.json()
  const planConfig = PLANS[plan]
  if (!planConfig) return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })

  // Utilise le même client — le dynamic import du Sprint 2 était redondant et risqué
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, stripe_customer_id')
    .eq('id', tenantId)
    .single()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://translog-v2.vercel.app'
  const priceId = planConfig.priceId

  console.log('[Checkout] plan=%s priceId=%s tenant=%s', plan, priceId, tenantId)

  if (!priceId) {
    console.error('[Checkout] priceId manquant pour le plan', plan)
    return NextResponse.json({ error: `Price ID manquant pour le plan ${plan}` }, { status: 500 })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: tenant?.stripe_customer_id ?? undefined,
      customer_email: !tenant?.stripe_customer_id ? user.email : undefined,
      metadata: { tenant_id: tenantId },
      subscription_data: {
        metadata: { tenant_id: tenantId },
        trial_period_days: 14,
      },
      success_url: `${appUrl}/dashboard/billing?success=1`,
      cancel_url: `${appUrl}/dashboard/billing?canceled=1`,
      locale: 'fr',
    })

    console.log('[Checkout] session créée:', session.id, session.url?.slice(0, 60))
    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[Checkout] Stripe error:', err.type, err.message, '| price:', priceId)
    return NextResponse.json(
      { error: `Stripe: ${err.message}` },
      { status: 500 }
    )
  }
}
