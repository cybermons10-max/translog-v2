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

export interface AppMetadata {
  role: Role
  tenant_id?: string
  subscription_status?: SubscriptionStatus
  trial_ends_at?: string
  plan?: Plan
}
