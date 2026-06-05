'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { calculateTarif, formatMontant } from '@/lib/utils'
import { TYPE_COLIS_OPTIONS, PAYS_OPTIONS } from '@/types'
import type { Tarif } from '@/types'
import { Plus } from 'lucide-react'

interface Props {
  tarifs: Tarif[]
}

const VILLES_DEPART = ['Lille', 'Paris', 'Lyon', 'Marseille', 'Roubaix', 'Tourcoing', 'Valenciennes', 'Lens', 'Douai', 'Dunkerque', 'Calais']

export function NouveauDossierModal({ tarifs }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    client_nom: '',
    client_phone: '',
    client_email: '',
    type_colis: 'moyen',
    poids_kg: '',
    description: '',
    ville_depart: 'Lille',
    ville_arrivee: '',
    pays_arrivee: 'Maroc',
    notes_internes: '',
  })

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const tarif = form.poids_kg && form.type_colis && form.pays_arrivee
    ? calculateTarif(tarifs, form.type_colis, parseFloat(form.poids_kg), form.pays_arrivee)
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.client_nom || !form.client_phone || !form.ville_arrivee) {
      setError('Remplissez les champs obligatoires')
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/dossiers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        poids_kg: form.poids_kg ? parseFloat(form.poids_kg) : null,
        montant_ht: tarif?.ht ?? null,
        montant_ttc: tarif?.ttc ?? null,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Erreur lors de la création')
      return
    }

    setOpen(false)
    router.push(`/dashboard/dossiers/${data.id}`)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
        style={{ backgroundColor: '#1e3a5f' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#162d4a')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1e3a5f')}
      >
        <Plus size={16} />
        Nouveau dossier
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1e3a5f]">Nouveau dossier de transport</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            {/* Client */}
            <fieldset className="border border-gray-200 rounded-lg p-4 space-y-3">
              <legend className="px-2 text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide">Informations client</legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="client_nom">Nom complet *</Label>
                  <Input id="client_nom" value={form.client_nom} onChange={e => set('client_nom', e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="client_phone">Téléphone *</Label>
                  <Input id="client_phone" value={form.client_phone} onChange={e => set('client_phone', e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="client_email">Email</Label>
                <Input id="client_email" type="email" value={form.client_email} onChange={e => set('client_email', e.target.value)} />
              </div>
            </fieldset>

            {/* Colis */}
            <fieldset className="border border-gray-200 rounded-lg p-4 space-y-3">
              <legend className="px-2 text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide">Colis</legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="type_colis">Type *</Label>
                  <select
                    id="type_colis"
                    value={form.type_colis}
                    onChange={e => set('type_colis', e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
                  >
                    {TYPE_COLIS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="poids_kg">Poids (kg)</Label>
                  <Input
                    id="poids_kg"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={form.poids_kg}
                    onChange={e => set('poids_kg', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Description du contenu</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  rows={2}
                  placeholder="Ex: Vêtements, appareils électroniques..."
                />
              </div>
            </fieldset>

            {/* Transport */}
            <fieldset className="border border-gray-200 rounded-lg p-4 space-y-3">
              <legend className="px-2 text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide">Transport</legend>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ville_depart">Ville de départ *</Label>
                  <select
                    id="ville_depart"
                    value={form.ville_depart}
                    onChange={e => set('ville_depart', e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
                  >
                    {VILLES_DEPART.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ville_arrivee">Ville d'arrivée *</Label>
                  <Input
                    id="ville_arrivee"
                    value={form.ville_arrivee}
                    onChange={e => set('ville_arrivee', e.target.value)}
                    placeholder="Ex: Casablanca"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pays_arrivee">Pays *</Label>
                  <select
                    id="pays_arrivee"
                    value={form.pays_arrivee}
                    onChange={e => set('pays_arrivee', e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
                  >
                    {PAYS_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </fieldset>

            {/* Tarif calculé */}
            {tarif && (
              <div className="rounded-lg p-4 border border-blue-200 bg-blue-50 flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Tarif calculé automatiquement</p>
                  <p className="text-sm text-blue-700 mt-0.5">HT : {formatMontant(tarif.ht)}</p>
                </div>
                <p className="text-2xl font-bold text-[#1e3a5f]">{formatMontant(tarif.ttc)} <span className="text-sm font-normal text-gray-500">TTC</span></p>
              </div>
            )}

            {!tarif && form.poids_kg && (
              <div className="rounded-lg p-3 border border-amber-200 bg-amber-50">
                <p className="text-xs text-amber-700">Aucun tarif configuré pour ce type de colis / pays. Le montant sera saisi manuellement.</p>
              </div>
            )}

            {/* Notes internes */}
            <div className="space-y-1">
              <Label htmlFor="notes_internes">Notes internes</Label>
              <Textarea
                id="notes_internes"
                value={form.notes_internes}
                onChange={e => set('notes_internes', e.target.value)}
                rows={2}
                placeholder="Informations visibles uniquement par votre équipe..."
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#1e3a5f' }}
              >
                {loading ? 'Création...' : 'Créer le dossier'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
