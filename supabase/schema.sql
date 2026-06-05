-- =============================================
-- TransLog V2 — Schéma complet
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- TENANTS
CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  logo_url      TEXT,
  primary_color TEXT DEFAULT '#2563eb',
  pays_desservis TEXT[] DEFAULT '{}',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial','active','suspended','cancelled')),
  plan          TEXT DEFAULT 'starter' CHECK (plan IN ('starter','pro','business')),
  trial_ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- PROFILES
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('superadmin','tenant_admin','tenant_staff','client')),
  full_name     TEXT,
  phone         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- DOSSIERS
CREATE TABLE dossiers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reference     TEXT NOT NULL,
  client_id     UUID REFERENCES profiles(id),
  client_nom    TEXT NOT NULL,
  client_phone  TEXT NOT NULL,
  client_email  TEXT,
  type_colis    TEXT NOT NULL,
  poids_kg      NUMERIC(10,2),
  description   TEXT,
  ville_depart  TEXT NOT NULL,
  ville_arrivee TEXT NOT NULL,
  pays_arrivee  TEXT NOT NULL,
  montant_ht    NUMERIC(10,2),
  montant_ttc   NUMERIC(10,2),
  statut        TEXT DEFAULT 'recu' CHECK (statut IN ('recu','confirme','en_transit','arrive','livre','annule')),
  transporteur_id UUID REFERENCES profiles(id),
  notes_internes TEXT,
  stripe_payment_id TEXT,
  paid_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- TARIFS
CREATE TABLE tarifs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type_colis    TEXT NOT NULL,
  poids_min_kg  NUMERIC(10,2) DEFAULT 0,
  poids_max_kg  NUMERIC(10,2),
  prix_base     NUMERIC(10,2) NOT NULL,
  prix_par_kg   NUMERIC(10,2) DEFAULT 0,
  pays_arrivee  TEXT,
  actif         BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- TRACKING GPS
CREATE TABLE tracking_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  dossier_id    UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  latitude      NUMERIC(10,7),
  longitude     NUMERIC(10,7),
  localisation  TEXT,
  statut        TEXT,
  message       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- TRIGGERS updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER dossiers_updated_at BEFORE UPDATE ON dossiers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Contrainte UNIQUE référence par tenant
ALTER TABLE dossiers ADD CONSTRAINT dossiers_reference_tenant_unique UNIQUE (tenant_id, reference);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarifs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;

-- Helper functions (SECURITY DEFINER = bypassent RLS)
CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- TENANTS
CREATE POLICY "tenants_select" ON tenants FOR SELECT
  USING (get_my_role() = 'superadmin' OR id = get_my_tenant_id());

CREATE POLICY "tenants_update" ON tenants FOR UPDATE
  USING (get_my_role() = 'superadmin')
  WITH CHECK (get_my_role() = 'superadmin');

-- PROFILES (pas de policy INSERT — service_role uniquement)
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (get_my_role() = 'superadmin' OR tenant_id = get_my_tenant_id());

-- DOSSIERS
CREATE POLICY "dossiers_select" ON dossiers FOR SELECT
  USING (get_my_role() = 'superadmin' OR tenant_id = get_my_tenant_id());

CREATE POLICY "dossiers_insert" ON dossiers FOR INSERT
  WITH CHECK (tenant_id = get_my_tenant_id());

CREATE POLICY "dossiers_update" ON dossiers FOR UPDATE
  USING (get_my_role() = 'superadmin' OR tenant_id = get_my_tenant_id())
  WITH CHECK (get_my_role() = 'superadmin' OR tenant_id = get_my_tenant_id());

-- TARIFS
CREATE POLICY "tarifs_all" ON tarifs FOR ALL
  USING (get_my_role() = 'superadmin' OR tenant_id = get_my_tenant_id());

-- TRACKING
CREATE POLICY "tracking_all" ON tracking_events FOR ALL
  USING (get_my_role() = 'superadmin' OR tenant_id = get_my_tenant_id());
