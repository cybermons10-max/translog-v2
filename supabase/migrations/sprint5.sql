-- =============================================
-- Sprint 5 — SMS + Web Push
-- Migration appliquée le 2026-06-05
-- =============================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint  TEXT NOT NULL,
  p256dh    TEXT NOT NULL,
  auth      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_select" ON push_subscriptions FOR SELECT
  USING (get_my_role() = 'superadmin' OR tenant_id = get_my_tenant_id());

CREATE POLICY "push_insert" ON push_subscriptions FOR INSERT
  WITH CHECK (tenant_id = get_my_tenant_id());

CREATE POLICY "push_delete" ON push_subscriptions FOR DELETE
  USING (user_id = auth.uid());
