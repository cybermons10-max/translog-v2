import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { formatMontant, statutBadgeClass, statutLabel } from '@/lib/utils'
import { DossierTimeline } from '@/components/dashboard/DossierTimeline'
import { StatutSelect } from '@/components/dashboard/StatutSelect'
import { DossierPdfButton } from '@/components/dashboard/DossierPdfButton'
import Link from 'next/link'
import type { Dossier, Tenant } from '@/types'
import { ArrowLeft, Phone, Mail, Package, MapPin, Calendar } from 'lucide-react'

export default async function DossierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = user.app_metadata?.tenant_id
  if (!tenantId) redirect('/login')

  const { id } = await params

  const [{ data: dossier }, { data: tenant }] = await Promise.all([
    supabase.from('dossiers').select('*').eq('id', id).eq('tenant_id', tenantId).single(),
    supabase.from('tenants').select('name, slug, logo_url').eq('id', tenantId).single(),
  ])

  if (!dossier) notFound()

  const d = dossier as Dossier

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/dossiers" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1e3a5f] transition-colors">
          <ArrowLeft size={15} />
          Retour aux dossiers
        </Link>
        <div className="flex items-center gap-3">
          <DossierPdfButton dossier={d} tenant={tenant as Pick<Tenant, 'name' | 'slug'>} />
        </div>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Référence dossier</p>
            <h1 className="text-2xl font-bold text-[#1e3a5f] font-mono mt-0.5">{d.reference}</h1>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Calendar size={11} />
              Créé le {new Date(d.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">Montant TTC</p>
            <p className="text-3xl font-bold text-[#1e3a5f]">{formatMontant(d.montant_ttc)}</p>
            {d.montant_ht && <p className="text-xs text-gray-400">HT : {formatMontant(d.montant_ht)}</p>}
          </div>
        </div>

        {/* Timeline */}
        <div className="border-t border-gray-100 pt-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-4">Progression</p>
          <DossierTimeline current={d.statut as any} />
        </div>

        {/* Statut update */}
        <div className="border-t border-gray-100 pt-4 mt-4 flex items-center gap-3">
          <p className="text-xs text-gray-500 font-medium">Modifier le statut :</p>
          <StatutSelect dossierId={d.id} current={d.statut as any} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Client */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xs uppercase tracking-wide font-semibold text-[#1e3a5f] mb-4">Client</h2>
          <div className="space-y-2.5">
            <p className="text-sm font-semibold text-gray-800">{d.client_nom}</p>
            <p className="flex items-center gap-2 text-sm text-gray-600">
              <Phone size={13} className="text-gray-400" />
              {d.client_phone}
            </p>
            {d.client_email && (
              <p className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={13} className="text-gray-400" />
                {d.client_email}
              </p>
            )}
          </div>
        </div>

        {/* Transport */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xs uppercase tracking-wide font-semibold text-[#1e3a5f] mb-4">Transport</h2>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2">
              <MapPin size={13} className="text-gray-400 mt-0.5 shrink-0" />
              <div className="text-sm text-gray-600">
                <span className="text-xs text-gray-400 block">Départ</span>
                <span className="font-medium text-gray-800">{d.ville_depart}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={13} className="text-[#1e3a5f] mt-0.5 shrink-0" />
              <div className="text-sm text-gray-600">
                <span className="text-xs text-gray-400 block">Arrivée</span>
                <span className="font-medium text-gray-800">{d.ville_arrivee}, {d.pays_arrivee}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Colis */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xs uppercase tracking-wide font-semibold text-[#1e3a5f] mb-4">Colis</h2>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Package size={13} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-800 capitalize">{d.type_colis}</span>
              {d.poids_kg && <span className="text-xs text-gray-400">— {d.poids_kg} kg</span>}
            </div>
            {d.description && (
              <p className="text-sm text-gray-600 bg-gray-50 rounded p-2.5">{d.description}</p>
            )}
          </div>
        </div>

        {/* Notes internes */}
        {d.notes_internes && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-xs uppercase tracking-wide font-semibold text-[#1e3a5f] mb-4">Notes internes</h2>
            <p className="text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded p-2.5">{d.notes_internes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
