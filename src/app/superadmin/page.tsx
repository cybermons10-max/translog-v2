import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Tenant } from '@/types'
import { TenantActions } from '@/components/superadmin/TenantActions'
import { PLANS } from '@/lib/stripe'

const PLAN_PRICE: Record<string, number> = { starter: 69, pro: 99, business: 149 }

function statusBadge(status: string) {
  const cfg: Record<string, string> = {
    active:    'bg-green-100 text-green-700',
    trial:     'bg-blue-100 text-blue-700',
    suspended: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-600',
  }
  return cfg[status] ?? 'bg-gray-100 text-gray-600'
}

export default async function SuperadminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'superadmin') redirect('/login')

  const adminClient = createAdminClient()

  const [{ data: tenants }, { data: allDossiers }] = await Promise.all([
    adminClient.from('tenants').select('*').order('created_at', { ascending: false }),
    adminClient.from('dossiers').select('tenant_id'),
  ])

  const tenantList = (tenants as Tenant[]) ?? []

  const dossierCountByTenant: Record<string, number> = {}
  for (const d of (allDossiers ?? []) as { tenant_id: string }[]) {
    dossierCountByTenant[d.tenant_id] = (dossierCountByTenant[d.tenant_id] ?? 0) + 1
  }

  const activeCount = tenantList.filter(t => t.subscription_status === 'active').length
  const trialCount  = tenantList.filter(t => t.subscription_status === 'trial').length
  const suspendedCount = tenantList.filter(t => ['suspended', 'cancelled'].includes(t.subscription_status)).length
  const mrr = tenantList
    .filter(t => t.subscription_status === 'active')
    .reduce((sum, t) => sum + (PLAN_PRICE[t.plan] ?? 0), 0)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">TransLog V2 — Superadmin</h1>
        <form action="/api/auth/signout" method="POST">
          <button className="text-sm text-gray-400 hover:text-white">Déconnexion</button>
        </form>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'MRR', value: `${mrr} €`, color: 'text-green-400', sub: 'Revenus mensuels récurrents' },
            { label: 'Actifs', value: activeCount, color: 'text-green-400', sub: 'Abonnements actifs' },
            { label: 'En essai', value: trialCount, color: 'text-blue-400', sub: 'Période trial' },
            { label: 'Suspendus', value: suspendedCount, color: 'text-red-400', sub: 'Accès coupé' },
          ].map(s => (
            <div key={s.label} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <p className="text-xs text-gray-400">{s.sub}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tenants table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold">Tous les tenants ({tenantList.length})</h2>
            <p className="text-xs text-gray-400">Total dossiers plateforme : {allDossiers?.length ?? 0}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-medium">Société</th>
                  <th className="px-5 py-3 text-left font-medium">Slug</th>
                  <th className="px-5 py-3 text-left font-medium">Plan</th>
                  <th className="px-5 py-3 text-left font-medium">Statut</th>
                  <th className="px-5 py-3 text-right font-medium">MRR</th>
                  <th className="px-5 py-3 text-right font-medium">Dossiers</th>
                  <th className="px-5 py-3 text-left font-medium">Créé le</th>
                  <th className="px-5 py-3 text-left font-medium">Fin essai</th>
                  <th className="px-5 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {tenantList.map(t => (
                  <tr key={t.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-3 font-medium">{t.name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">{t.slug}</td>
                    <td className="px-5 py-3 text-sm capitalize">{t.plan}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(t.subscription_status)}`}>
                        {t.subscription_status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-medium">
                      {t.subscription_status === 'active' ? `${PLAN_PRICE[t.plan] ?? 0} €` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right text-sm">{dossierCountByTenant[t.id] ?? 0}</td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {new Date(t.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {t.trial_ends_at ? new Date(t.trial_ends_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <TenantActions tenantId={t.id} currentStatus={t.subscription_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
