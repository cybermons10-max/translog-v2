import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

export const PLANS = {
  starter: {
    label: 'Starter',
    price: 69,
    priceId: process.env.STRIPE_PRICE_STARTER!,
    features: ['Dossiers clients', 'Devis PDF', 'Suivi statuts', 'Espace client', '1 admin + 1 transporteur'],
  },
  pro: {
    label: 'Pro',
    price: 99,
    priceId: process.env.STRIPE_PRICE_PRO!,
    features: ['Tout Starter', 'Paiement Stripe', 'GPS temps réel', 'SMS', 'Multi-transporteurs', 'Dashboard avancé'],
  },
  business: {
    label: 'Business',
    price: 149,
    priceId: process.env.STRIPE_PRICE_BUSINESS!,
    features: ['Tout Pro', 'Multi-agences', 'Marque blanche', 'Domaine personnalisé', 'Exports comptables', 'Support prioritaire'],
  },
} as const

export type PlanKey = keyof typeof PLANS

export function planFromPriceId(priceId: string): PlanKey | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) return key as PlanKey
  }
  return null
}
