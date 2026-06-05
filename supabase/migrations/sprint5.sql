-- =============================================
-- Sprint 5 — SMS + Web Push
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- SMS toggle par tenant (Plan Pro/Business)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT false;

-- Table abonnements push Web
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint      TEXT NOT NULL,
  auth_key      TEXT NOT NULL,
  p256dh_key    TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Chaque user gère ses propres abonnements push
CREATE POLICY "push_own" ON push_subscriptions FOR ALL
  USING (user_id = auth.uid());

-- Superadmin peut lire tous les abonnements pour envoyer des notifications
CREATE POLICY "push_admin_read" ON push_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'superadmin'
    )
  );
