import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatMontant } from '@/lib/utils'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { CsvExportButton } from '@/components/dashboard/CsvExportButton'
import type { Dossier } from '@/types'

function monthKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = user.app_metadata?.tenant_id
  if (!tenantId) redirect('/login')

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [{ data: allDossiers }, { data: monthDossiers }] = await Promise.all([
    supabase.from('dossiers')
      .select('id, statut, montant_ttc, ville_arrivee, pays_arrivee, created_at, updated_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', sixMonthsAgo.toISOString()),
    supabase.from('dossiers')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('created_at', startOfMonth)
      .order('created_at', { ascending: false }),
  ])

  const dossiers = (allDossiers ?? []) as Pick<Dossier, 'id' | 'statut' | 'montant_ttc' | 'ville_arrivee' | 'pays_arrivee' | 'created_at' | 'updated_at'>[]

  // Revenus par mois (6 mois)
  const monthsMap: Record<string, { revenue: number; count: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthsMap[k] = { revenue: 0, count: 0 }
  }
  for (const d of dossiers) {
    const k = monthKey(d.created_at)
    if (monthsMap[k]) {
      monthsMap[k].revenue += d.montant_ttc ?? 0
      monthsMap[k].count++
    }
  }
  const revenueData = Object.entries(monthsMap).map(([k, v]) => ({
    month: monthLabel(k), revenue: Math.round(v.revenue * 100) / 100, count: v.count,
  }))

  // KPIs
  const total = dossiers.length
  const delivered = dossiers.filter(d => d.statut === 'livre')
  const deliveryRate = total > 0 ? (delivered.length / total * 100).toFixed(1) : '0'

  const avgDeliveryDays = delivered.length > 0
    ? (delivered.reduce((sum, d) => sum + (new Date(d.updated_at).getTime() - new Date(d.created_at).getTime()), 0) / delivered.length / 86400000).toFixed(1)
    : null

  // Top 5 destinations
  const destCount: Record<string, number> = {}
  for (const d of dossiers) {
    const k = `${d.ville_arrivee}, ${d.pays_arrivee}`
    destCount[k] = (destCount[k] ?? 0) + 1
  }
  const top5 = Object.entries(destCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxDest = top5[0]?.[1] ?? 1

  // Revenus 6 mois total
  const totalRevenue = dossiers.reduce((sum, d) => sum + (d.montant_ttc ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1e3a5f]">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">6 derniers mois</p>
        </div>
        <CsvExportButton dossiers={(monthDossiers as Dossier[]) ?? []} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Dossiers (6 mois)', value: total, color: 'text-[#1e3a5f]' },
          { label: 'Revenus (6 mois)', value: formatMontant(totalRevenue), color: 'text-green-600' },
          { label: 'Taux de livraison', value: `${deliveryRate}%`, color: 'text-blue-600' },
          { label: 'Délai moyen livraison', value: avgDeliveryDays ? `${avgDeliveryDays}j` : '—', color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Graphique revenus */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-[#1e3a5f] mb-4">Revenus mensuels (TTC)</h2>
        <RevenueChart data={revenueData} />
      </div>

      {/* Top destinations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-[#1e3a5f] mb-4">Top 5 destinations</h2>
        {!top5.length ? (
          <p className="text-gray-400 text-sm">Aucune donnée</p>
        ) : (
          <div className="space-y-3">
            {top5.map(([dest, count], i) => (
              <div key={dest} className="flex items-center gap-3">
                <span className="w-5 text-xs font-bold text-gray-400">#{i + 1}</span>
                <span className="text-sm text-gray-800 w-40 truncate">{dest}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(count / maxDest) * 100}%`, backgroundColor: '#1e3a5f' }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
