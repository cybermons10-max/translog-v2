export type Role = 'superadmin' | 'tenant_admin' | 'tenant_staff' | 'client'
export type SubscriptionStatus = 'trial' | 'active' | 'suspended' | 'cancelled'
export type Plan = 'starter' | 'pro' | 'business'
export type DossierStatut = 'recu' | 'confirme' | 'en_transit' | 'arrive' | 'livre' | 'annule'

export interface Tenant {
  id: string
  slug: string
  name: string
  logo_url: string | null
  primary_color: string
  pays_desservis: string[]
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: SubscriptionStatus
  plan: Plan
  trial_ends_at: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  tenant_id: string | null
  role: Role
  full_name: string | null
  phone: string | null
  created_at: string
}

export interface Dossier {
  id: string
  tenant_id: string
  reference: string
  client_id: string | null
  client_nom: string
  client_phone: string
  client_email: string | null
  type_colis: string
  poids_kg: number | null
  description: string | null
  ville_depart: string
  ville_arrivee: string
  pays_arrivee: string
  montant_ht: number | null
  montant_ttc: number | null
  statut: DossierStatut
  transporteur_id: string | null
  notes_internes: string | null
  stripe_payment_id: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface Tarif {
  id: string
  tenant_id: string
  type_colis: string
  poids_min_kg: number
  poids_max_kg: number | null
  prix_base: number
  prix_par_kg: number
  pays_arrivee: string | null
  actif: boolean
  created_at: string
}

export interface AppMetadata {
  role: Role
  tenant_id?: string
  subscription_status?: SubscriptionStatus
  trial_ends_at?: string
  plan?: Plan
}

export const STATUT_CONFIG: Record<DossierStatut, { label: string; bg: string; text: string; ring: string }> = {
  recu:       { label: 'Reçu',        bg: 'bg-gray-100',   text: 'text-gray-700',   ring: 'ring-gray-300' },
  confirme:   { label: 'Confirmé',    bg: 'bg-blue-100',   text: 'text-blue-700',   ring: 'ring-blue-300' },
  en_transit: { label: 'En transit',  bg: 'bg-amber-100',  text: 'text-amber-700',  ring: 'ring-amber-300' },
  arrive:     { label: 'Arrivé',      bg: 'bg-purple-100', text: 'text-purple-700', ring: 'ring-purple-300' },
  livre:      { label: 'Livré',       bg: 'bg-green-100',  text: 'text-green-700',  ring: 'ring-green-300' },
  annule:     { label: 'Annulé',      bg: 'bg-red-100',    text: 'text-red-700',    ring: 'ring-red-300' },
}

export const STATUT_ORDER: DossierStatut[] = ['recu', 'confirme', 'en_transit', 'arrive', 'livre']

export const TYPE_COLIS_OPTIONS = [
  { value: 'petit',        label: 'Petit colis (< 5 kg)' },
  { value: 'moyen',        label: 'Colis moyen (5–20 kg)' },
  { value: 'volumineux',   label: 'Colis volumineux (20–50 kg)' },
  { value: 'electromenager', label: 'Électroménager (> 50 kg)' },
]

export const PAYS_OPTIONS = [
  'Maroc', 'Algérie', 'Tunisie', 'Sénégal', 'Mali', 'Mauritanie', "Côte d'Ivoire"
]
