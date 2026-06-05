import { stripe, planFromPriceId } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

// Stripe requires the raw body to verify the signature — disable body parsing
export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  const admin = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const tenantId = session.metadata?.tenant_id
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        if (!tenantId) break

        // Récupérer le plan depuis l'abonnement
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id
        const plan = planFromPriceId(priceId) ?? 'starter'
        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null

        await admin.from('tenants').update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: 'active',
          plan,
        }).eq('id', tenantId)

        // Sync app_metadata de tous les users du tenant
        await syncTenantMetadata(admin, tenantId, 'active', plan, trialEnd)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        const { data: tenant } = await admin.from('tenants').select('id, plan').eq('stripe_customer_id', customerId).single()
        if (!tenant) break

        const priceId = sub.items.data[0]?.price.id
        const plan = planFromPriceId(priceId) ?? (tenant.plan as string)
        const status = sub.status === 'active' ? 'active'
          : sub.status === 'past_due' ? 'suspended'
          : sub.status === 'canceled' ? 'cancelled'
          : 'suspended'

        await admin.from('tenants').update({
          subscription_status: status,
          plan,
          stripe_subscription_id: sub.id,
        }).eq('id', tenant.id)

        await syncTenantMetadata(admin, tenant.id, status, plan, null)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        const { data: tenant } = await admin.from('tenants').select('id').eq('stripe_customer_id', customerId).single()
        if (!tenant) break

        await admin.from('tenants').update({
          subscription_status: 'suspended',
          stripe_subscription_id: null,
        }).eq('id', tenant.id)

        await syncTenantMetadata(admin, tenant.id, 'suspended', 'starter', null)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: tenant } = await admin.from('tenants').select('id').eq('stripe_customer_id', customerId).single()
        if (!tenant) break

        await admin.from('tenants').update({ subscription_status: 'suspended' }).eq('id', tenant.id)
        await syncTenantMetadata(admin, tenant.id, 'suspended', 'starter', null)
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function syncTenantMetadata(
  admin: ReturnType<typeof createAdminClient>,
  tenantId: string,
  status: string,
  plan: string,
  trialEndsAt: string | null
) {
  const { data: profiles } = await admin.from('profiles').select('id').eq('tenant_id', tenantId)
  if (!profiles) return

  await Promise.all(
    profiles.map((p: { id: string }) =>
      admin.auth.admin.updateUserById(p.id, {
        app_metadata: {
          subscription_status: status,
          plan,
          ...(trialEndsAt ? { trial_ends_at: trialEndsAt } : {}),
        },
      })
    )
  )
}
