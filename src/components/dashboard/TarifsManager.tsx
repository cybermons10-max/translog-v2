'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Tarif } from '@/types'
import { TYPE_COLIS_OPTIONS, PAYS_OPTIONS } from '@/types'
import { formatMontant } from '@/lib/utils'
import { Plus, Trash2, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  tarifs: Tarif[]
  tenantId: string
}

const DEFAULT_TARIFS = [
  { type_colis: 'petit',          poids_min_kg: 0, poids_max_kg: 5,   prix_base: 50,  prix_par_kg: 5,  pays_arrivee: null },
  { type_colis: 'moyen',          poids_min_kg: 5, poids_max_kg: 20,  prix_base: 80,  prix_par_kg: 4,  pays_arrivee: null },
  { type_colis: 'volumineux',     poids_min_kg: 20, poids_max_kg: 50, prix_base: 150, prix_par_kg: 3,  pays_arrivee: null },
  { type_colis: 'electromenager', poids_min_kg: 0, poids_max_kg: null, prix_base: 200, prix_par_kg: 2.5, pays_arrivee: null },
]

export function TarifsManager({ tarifs, tenantId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    type_colis: 'moyen',
    poids_min_kg: '0',
    poids_max_kg: '',
    prix_base: '',
    prix_par_kg: '0',
    pays_arrivee: '',
  })

  async function addDefaults() {
    setLoading('defaults')
    for (const t of DEFAULT_TARIFS) {
      await fetch('/api/tarifs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t),
      })
    }
    setLoading(null)
    router.refresh()
  }

  async function deleteTarif(id: string) {
    setLoading(id)
    await fetch(`/api/tarifs/${id}`, { method: 'DELETE' })
    setLoading(null)
    router.refresh()
  }

  async function toggleActif(t: Tarif) {
    setLoading(t.id)
    await fetch(`/api/tarifs/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actif: !t.actif }),
    })
    setLoading(null)
    router.refresh()
  }

  async function handleAddTarif(e: React.FormEvent) {
    e.preventDefault()
    setLoading('new')
    await fetch('/api/tarifs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type_colis: form.type_colis,
        poids_min_kg: parseFloat(form.poids_min_kg) || 0,
        poids_max_kg: form.poids_max_kg ? parseFloat(form.poids_max_kg) : null,
        prix_base: parseFloat(form.prix_base) || 0,
        prix_par_kg: parseFloat(form.prix_par_kg) || 0,
        pays_arrivee: form.pays_arrivee || null,
      }),
    })
    setLoading(null)
    setShowForm(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {tarifs.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-gray-500 text-sm mb-4">Aucun tarif configuré.<br />Ajoutez des tarifs par défaut ou créez les vôtres.</p>
          <button
            onClick={addDefaults}
            disabled={loading === 'defaults'}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            {loading === 'defaults' ? 'Ajout...' : 'Ajouter les tarifs par défaut'}
          </button>
        </div>
      )}

      {tarifs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-[#1e3a5f] text-sm">Tarifs actifs ({tarifs.filter(t => t.actif).length})</h2>
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              <Plus size={14} />
              Ajouter
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th className="px-5 py-3 text-left font-medium">Type colis</th>
                <th className="px-5 py-3 text-left font-medium">Poids (kg)</th>
                <th className="px-5 py-3 text-left font-medium">Prix base</th>
                <th className="px-5 py-3 text-left font-medium">Prix/kg</th>
                <th className="px-5 py-3 text-left font-medium">Pays</th>
                <th className="px-5 py-3 text-center font-medium">Actif</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tarifs.map(t => (
                <tr key={t.id} className={`transition-colors ${t.actif ? 'hover:bg-gray-50' : 'opacity-50 bg-gray-50'}`}>
                  <td className="px-5 py-3 text-sm font-medium capitalize">{TYPE_COLIS_OPTIONS.find(o => o.value === t.type_colis)?.label ?? t.type_colis}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {t.poids_min_kg} – {t.poids_max_kg ?? '∞'} kg
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-[#1e3a5f]">{formatMontant(t.prix_base)}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{t.prix_par_kg > 0 ? `+${formatMontant(t.prix_par_kg)}/kg` : '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{t.pays_arrivee ?? 'Tous'}</td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => toggleActif(t)} disabled={loading === t.id}>
                      <div className={`w-10 h-5 rounded-full transition-colors ${t.actif ? 'bg-[#1e3a5f]' : 'bg-gray-200'} relative`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${t.actif ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => deleteTarif(t.id)} disabled={loading === t.id} className="text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-[#1e3a5f] mb-4">Nouveau tarif</h3>
          <form onSubmit={handleAddTarif} className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Type de colis</Label>
              <select value={form.type_colis} onChange={e => setForm(p => ({ ...p, type_colis: e.target.value }))}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none">
                {TYPE_COLIS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Poids min (kg)</Label>
              <Input type="number" min="0" step="0.1" value={form.poids_min_kg} onChange={e => setForm(p => ({ ...p, poids_min_kg: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Poids max (kg, vide=∞)</Label>
              <Input type="number" min="0" step="0.1" value={form.poids_max_kg} onChange={e => setForm(p => ({ ...p, poids_max_kg: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Prix de base (€ HT)</Label>
              <Input type="number" min="0" step="0.01" value={form.prix_base} onChange={e => setForm(p => ({ ...p, prix_base: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <Label>Prix par kg (€)</Label>
              <Input type="number" min="0" step="0.01" value={form.prix_par_kg} onChange={e => setForm(p => ({ ...p, prix_par_kg: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Pays (vide=tous)</Label>
              <select value={form.pays_arrivee} onChange={e => setForm(p => ({ ...p, pays_arrivee: e.target.value }))}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none">
                <option value="">Tous les pays</option>
                {PAYS_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="col-span-2 md:col-span-3 flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600">Annuler</button>
              <button type="submit" disabled={loading === 'new'} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#1e3a5f' }}>
                {loading === 'new' ? 'Ajout...' : 'Ajouter le tarif'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
