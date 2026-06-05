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

  const { data: tenant } = await (await import('@/lib/supabase/server')).createClient()
    .then(s => s.from('tenants').select('name, stripe_customer_id').eq('id', tenantId).single())

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://translog-v2.vercel.app'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
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

  return NextResponse.json({ url: session.url })
}
