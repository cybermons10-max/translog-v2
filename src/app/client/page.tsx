'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { statutBadgeClass, statutLabel } from '@/lib/utils'
import { STATUT_ORDER, STATUT_CONFIG } from '@/types'
import type { DossierStatut } from '@/types'
import { Search, Package, MapPin, Calendar, Check } from 'lucide-react'

interface DossierResult {
  reference: string
  client_nom: string
  type_colis: string
  poids_kg: number | null
  ville_depart: string
  ville_arrivee: string
  pays_arrivee: string
  statut: DossierStatut
  created_at: string
  updated_at: string
  tenant: { name: string }
}

export default function ClientPage() {
  const [reference, setReference] = useState('')
  const [result, setResult] = useState<DossierResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!reference.trim()) return
    setLoading(true)
    setResult(null)
    setNotFound(false)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('dossiers')
      .select('reference, client_nom, type_colis, poids_kg, ville_depart, ville_arrivee, pays_arrivee, statut, created_at, updated_at, tenant:tenant_id(name)')
      .eq('reference', reference.trim().toUpperCase())
      .maybeSingle()

    setLoading(false)
    if (error || !data) {
      setNotFound(true)
    } else {
      setResult(data as unknown as DossierResult)
    }
  }

  const currentIdx = result ? STATUT_ORDER.indexOf(result.statut) : -1

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f2f5' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#1e3a5f' }} className="px-6 py-4 shadow-md">
        <h1 className="text-white font-bold text-xl">Suivi de colis</h1>
        <p className="text-white/60 text-sm mt-0.5">Entrez votre référence de dossier pour suivre votre envoi</p>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={reference}
            onChange={e => setReference(e.target.value.toUpperCase())}
            placeholder="Ex: TSM-2026-0001"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 bg-white shadow-sm uppercase"
          />
          <button
            type="submit"
            disabled={loading || !reference.trim()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            <Search size={16} />
            {loading ? 'Recherche...' : 'Suivre'}
          </button>
        </form>

        {/* Not found */}
        {notFound && (
          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 text-center">
            <p className="text-red-600 font-medium">Référence introuvable</p>
            <p className="text-sm text-gray-500 mt-1">Vérifiez la référence indiquée sur votre confirmation</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div style={{ backgroundColor: '#1e3a5f' }} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-xs">Référence</p>
                  <p className="text-white font-bold text-lg font-mono">{result.reference}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statutBadgeClass(result.statut)}`}>
                  {statutLabel(result.statut)}
                </span>
              </div>
              <p className="text-white/60 text-xs mt-1">{result.tenant?.name}</p>
            </div>

            {/* Timeline */}
            {result.statut !== 'annule' && (
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-0">
                  {STATUT_ORDER.map((s, i) => {
                    const done = i < currentIdx
                    const active = i === currentIdx
                    return (
                      <div key={s} className="flex items-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                            done ? 'bg-[#1e3a5f] border-[#1e3a5f]' :
                            active ? 'bg-white border-[#1e3a5f] ring-3 ring-[#1e3a5f]/20' :
                            'bg-white border-gray-200'
                          }`}>
                            {done ? <Check size={12} className="text-white" strokeWidth={3} /> :
                              <div className={`w-2 h-2 rounded-full ${active ? 'bg-[#1e3a5f]' : 'bg-gray-200'}`} />}
                          </div>
                          <span className={`text-xs whitespace-nowrap ${done || active ? 'text-[#1e3a5f] font-medium' : 'text-gray-400'}`}>
                            {STATUT_CONFIG[s].label}
                          </span>
                        </div>
                        {i < STATUT_ORDER.length - 1 && (
                          <div className={`h-0.5 w-8 mb-5 mx-0.5 ${i < currentIdx ? 'bg-[#1e3a5f]' : 'bg-gray-200'}`} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Details */}
            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Destinataire</p>
                <p className="text-sm font-medium text-gray-800">{result.client_nom}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Type de colis</p>
                <p className="text-sm text-gray-700 capitalize">{result.type_colis}{result.poids_kg ? ` — ${result.poids_kg} kg` : ''}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><MapPin size={10} />Départ</p>
                <p className="text-sm text-gray-700">{result.ville_depart}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><MapPin size={10} />Destination</p>
                <p className="text-sm font-medium text-gray-800">{result.ville_arrivee}, {result.pays_arrivee}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><Calendar size={10} />Date de dépôt</p>
                <p className="text-sm text-gray-700">{new Date(result.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Dernière mise à jour</p>
                <p className="text-sm text-gray-700">{new Date(result.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
