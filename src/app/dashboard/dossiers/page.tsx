import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatMontant, statutBadgeClass, statutLabel } from '@/lib/utils'
import { NouveauDossierModal } from '@/components/dashboard/NouveauDossierModal'
import Link from 'next/link'
import type { Dossier, Tarif } from '@/types'
import { STATUT_CONFIG } from '@/types'

interface SearchParams { statut?: string }

export default async function DossiersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = user.app_metadata?.tenant_id
  if (!tenantId) redirect('/login')

  const { statut } = await searchParams

  const [{ data: tarifs }, dossiersQuery] = await Promise.all([
    supabase.from('tarifs').select('*').eq('tenant_id', tenantId).eq('actif', true),
    (() => {
      let q = supabase.from('dossiers').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
      if (statut) q = q.eq('statut', statut)
      return q
    })(),
  ])

  const dossiers = dossiersQuery.data as Dossier[] | null

  const statuts = ['recu', 'confirme', 'en_transit', 'arrive', 'livre', 'annule'] as const

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1e3a5f]">Dossiers</h1>
        <NouveauDossierModal tarifs={(tarifs as Tarif[]) ?? []} />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href="/dashboard/dossiers"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            !statut ? 'bg-[#1e3a5f] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Tous
        </Link>
        {statuts.map(s => (
          <Link
            key={s}
            href={`/dashboard/dossiers?statut=${s}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statut === s
                ? `${STATUT_CONFIG[s].bg} ${STATUT_CONFIG[s].text} ring-1 ${STATUT_CONFIG[s].ring}`
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {STATUT_CONFIG[s].label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {!dossiers?.length ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            {statut ? `Aucun dossier avec le statut "${STATUT_CONFIG[statut as keyof typeof STATUT_CONFIG]?.label}"` : 'Aucun dossier pour l\'instant'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th className="px-5 py-3 text-left font-medium">Référence</th>
                <th className="px-5 py-3 text-left font-medium">Client</th>
                <th className="px-5 py-3 text-left font-medium">Téléphone</th>
                <th className="px-5 py-3 text-left font-medium">Colis</th>
                <th className="px-5 py-3 text-left font-medium">Destination</th>
                <th className="px-5 py-3 text-left font-medium">Statut</th>
                <th className="px-5 py-3 text-right font-medium">TTC</th>
                <th className="px-5 py-3 text-left font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dossiers.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/dashboard/dossiers/${d.id}`} className="font-mono text-sm text-[#1e3a5f] hover:underline font-medium">
                      {d.reference}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-800">{d.client_nom}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{d.client_phone}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 capitalize">{d.type_colis}{d.poids_kg ? ` — ${d.poids_kg} kg` : ''}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{d.ville_arrivee}, {d.pays_arrivee}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statutBadgeClass(d.statut)}`}>
                      {statutLabel(d.statut)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right font-medium text-gray-800">{formatMontant(d.montant_ttc)}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {new Date(d.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
