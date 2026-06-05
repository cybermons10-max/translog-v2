import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatMontant, statutBadgeClass, statutLabel } from '@/lib/utils'
import Link from 'next/link'
import type { Dossier } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = user.app_metadata?.tenant_id
  if (!tenantId) redirect('/login')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [{ data: dossiers }, { data: allDossiers }] = await Promise.all([
    supabase.from('dossiers').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(10),
    supabase.from('dossiers').select('id, statut, montant_ttc, created_at').eq('tenant_id', tenantId),
  ])

  const totalDossiers = allDossiers?.length ?? 0
  const dossiersEnCours = allDossiers?.filter(d => ['confirme', 'en_transit', 'arrive'].includes(d.statut)).length ?? 0
  const revenusMois = allDossiers
    ?.filter(d => d.created_at >= startOfMonth && d.montant_ttc)
    .reduce((sum, d) => sum + (d.montant_ttc ?? 0), 0) ?? 0

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total dossiers', value: totalDossiers, color: 'text-[#1e3a5f]' },
          { label: 'En cours', value: dossiersEnCours, color: 'text-amber-600' },
          { label: 'Revenus ce mois', value: formatMontant(revenusMois), color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Derniers dossiers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-[#1e3a5f]">Derniers dossiers</h2>
          <Link href="/dashboard/dossiers" className="text-sm text-[#1e3a5f] hover:underline">
            Voir tous →
          </Link>
        </div>
        {!dossiers?.length ? (
          <div className="p-10 text-center text-gray-400 text-sm">Aucun dossier pour l'instant</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3 text-left font-medium">Référence</th>
                <th className="px-6 py-3 text-left font-medium">Client</th>
                <th className="px-6 py-3 text-left font-medium">Destination</th>
                <th className="px-6 py-3 text-left font-medium">Statut</th>
                <th className="px-6 py-3 text-right font-medium">TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(dossiers as Dossier[]).map(d => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5">
                    <Link href={`/dashboard/dossiers/${d.id}`} className="font-mono text-sm text-[#1e3a5f] hover:underline">
                      {d.reference}
                    </Link>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-800">{d.client_nom}</td>
                  <td className="px-6 py-3.5 text-sm text-gray-600">{d.ville_arrivee}, {d.pays_arrivee}</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statutBadgeClass(d.statut)}`}>
                      {statutLabel(d.statut)}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-right font-medium">{formatMontant(d.montant_ttc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
