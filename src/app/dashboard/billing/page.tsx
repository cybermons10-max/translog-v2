import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PLANS } from '@/lib/stripe'
import type { Tenant } from '@/types'
import { BillingActions } from '@/components/dashboard/BillingActions'
import { Check, Zap } from 'lucide-react'

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ success?: string; canceled?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = user.app_metadata?.tenant_id
  if (!tenantId) redirect('/login')

  const { data: tenant } = await supabase.from('tenants').select('*').eq('id', tenantId).single()
  const t = tenant as Tenant

  const { success, canceled } = await searchParams
  const currentPlan = (t?.plan ?? 'starter') as keyof typeof PLANS
  const currentPlanConfig = PLANS[currentPlan]

  const isActive = t?.subscription_status === 'active'
  const isTrial = t?.subscription_status === 'trial'
  const isSuspended = ['suspended', 'cancelled'].includes(t?.subscription_status ?? '')

  const trialDaysLeft = isTrial && t?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(t.trial_ends_at).getTime() - Date.now()) / 86400000))
    : null

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-[#1e3a5f]">Abonnement</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gérez votre plan et vos informations de paiement</p>
      </div>

      {/* Notifications */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <Check size={16} className="text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-800">Abonnement activé !</p>
            <p className="text-sm text-green-600">Votre plan {currentPlanConfig?.label} est maintenant actif.</p>
          </div>
        </div>
      )}
      {canceled && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-800 text-sm">Paiement annulé. Votre essai gratuit reste actif.</p>
        </div>
      )}

      {/* Plan actuel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Plan actuel</p>
            <div className="flex items-center gap-2 mt-1">
              <h2 className="text-2xl font-bold text-[#1e3a5f]">{currentPlanConfig?.label}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isActive ? 'bg-green-100 text-green-700' :
                isTrial ? 'bg-blue-100 text-blue-700' :
                'bg-red-100 text-red-700'
              }`}>
                {isActive ? 'Actif' : isTrial ? `Essai — ${trialDaysLeft}j restants` : 'Suspendu'}
              </span>
            </div>
            <p className="text-3xl font-bold mt-2">{currentPlanConfig?.price}<span className="text-sm font-normal text-gray-400"> €/mois</span></p>
          </div>
          {t?.stripe_customer_id && (
            <BillingActions mode="portal" />
          )}
        </div>

        {/* Features du plan actuel */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <ul className="grid grid-cols-2 gap-1.5">
            {currentPlanConfig?.features.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <Check size={13} className="text-green-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Changer de plan */}
      <div>
        <h3 className="text-sm font-semibold text-[#1e3a5f] mb-3 flex items-center gap-2">
          <Zap size={14} />
          Changer de plan
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {(Object.entries(PLANS) as [keyof typeof PLANS, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => {
            const isCurrent = key === currentPlan
            return (
              <div key={key} className={`bg-white rounded-xl border-2 p-4 ${isCurrent ? 'border-[#1e3a5f] bg-[#f8faff]' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-[#1e3a5f]">{plan.label}</p>
                    <p className="text-xl font-bold">{plan.price}<span className="text-xs font-normal text-gray-400">€/mois</span></p>
                  </div>
                  {isCurrent && <span className="text-xs bg-[#1e3a5f] text-white px-2 py-0.5 rounded-full">Actuel</span>}
                </div>
                <ul className="space-y-1 mb-4">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Check size={10} className="text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {!isCurrent && (
                  <BillingActions mode="checkout" plan={key} label={plan.price > (currentPlanConfig?.price ?? 0) ? '⬆ Passer à ce plan' : '⬇ Rétrograder'} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Infos Stripe */}
      {t?.stripe_customer_id && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-sm text-gray-500">
          <p>Customer Stripe : <code className="text-xs">{t.stripe_customer_id}</code></p>
          {t.stripe_subscription_id && <p className="mt-0.5">Abonnement : <code className="text-xs">{t.stripe_subscription_id}</code></p>}
        </div>
      )}
    </div>
  )
}
