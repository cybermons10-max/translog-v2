import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BillingActions } from '@/components/dashboard/BillingActions'

export default async function SuspendedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = user.app_metadata?.tenant_id
  const { data: tenant } = tenantId
    ? await supabase.from('tenants').select('name, stripe_customer_id, subscription_status').eq('id', tenantId).single()
    : { data: null }

  const hasBilling = !!tenant?.stripe_customer_id

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f2f5' }}>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">⛔</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Accès suspendu</h1>
        <p className="text-gray-500 text-sm mb-6">
          {tenant?.subscription_status === 'trial'
            ? "Votre période d'essai est terminée."
            : "Votre abonnement a été suspendu."}{' '}
          Réactivez votre compte pour continuer à utiliser TransLog.
        </p>

        <div className="space-y-3">
          {hasBilling ? (
            <BillingActions mode="portal" />
          ) : (
            <BillingActions mode="checkout" plan="starter" label="Activer mon abonnement — 69€/mois" />
          )}
          <p className="text-xs text-gray-400">
            Des questions ?{' '}
            <a href="mailto:support@cybermons.fr" className="text-[#1e3a5f] hover:underline">
              support@cybermons.fr
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
