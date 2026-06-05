import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatMontant(montant: number | null): string {
  if (montant === null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant)
}

export function statutLabel(statut: string): string {
  const labels: Record<string, string> = {
    recu: 'Reçu',
    confirme: 'Confirmé',
    en_transit: 'En transit',
    arrive: 'Arrivé',
    livre: 'Livré',
    annule: 'Annulé',
  }
  return labels[statut] ?? statut
}

export function statutBadgeClass(statut: string): string {
  const classes: Record<string, string> = {
    recu:       'bg-gray-100 text-gray-700',
    confirme:   'bg-blue-100 text-blue-700',
    en_transit: 'bg-amber-100 text-amber-700',
    arrive:     'bg-purple-100 text-purple-700',
    livre:      'bg-green-100 text-green-700',
    annule:     'bg-red-100 text-red-700',
  }
  return classes[statut] ?? 'bg-gray-100 text-gray-700'
}

export function calculateTarif(
  tarifs: { type_colis: string; poids_min_kg: number; poids_max_kg: number | null; prix_base: number; prix_par_kg: number; pays_arrivee: string | null; actif: boolean }[],
  typeColis: string,
  poidsKg: number,
  paysArrivee: string
): { ht: number; ttc: number } | null {
  const candidates = tarifs
    .filter(t => t.actif && t.type_colis === typeColis)
    .filter(t => poidsKg >= t.poids_min_kg && (t.poids_max_kg === null || poidsKg <= t.poids_max_kg))
    .filter(t => t.pays_arrivee === null || t.pays_arrivee === paysArrivee)
    .sort((a, b) => (b.pays_arrivee !== null ? 1 : 0) - (a.pays_arrivee !== null ? 1 : 0))

  if (!candidates.length) return null
  const t = candidates[0]
  const ht = t.prix_base + poidsKg * t.prix_par_kg
  return { ht: Math.round(ht * 100) / 100, ttc: Math.round(ht * 1.2 * 100) / 100 }
}

export function generateReference(tenantName: string, count: number): string {
  const prefix = tenantName
    .split(/\s+/)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3) || 'TLG'
  const year = new Date().getFullYear()
  return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`
}
