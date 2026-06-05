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

export function statutColor(statut: string): string {
  const colors: Record<string, string> = {
    recu: 'secondary',
    confirme: 'default',
    en_transit: 'outline',
    arrive: 'default',
    livre: 'default',
    annule: 'destructive',
  }
  return colors[statut] ?? 'secondary'
}
