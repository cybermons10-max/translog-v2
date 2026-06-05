import webpush from 'web-push'
import { createAdminClient } from './supabase/server'

export function configurePush() {
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const email = process.env.VAPID_EMAIL ?? 'mailto:support@cybermons.fr'
  if (!pub || !priv) return false
  webpush.setVapidDetails(email, pub, priv)
  return true
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

/** Envoie une notification push à tous les abonnés d'un tenant */
export async function notifyTenant(tenantId: string, payload: PushPayload) {
  if (!configurePush()) return

  const admin = createAdminClient()
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint, auth_key, p256dh_key')
    .eq('tenant_id', tenantId)

  if (!subs?.length) return

  const data = JSON.stringify(payload)

  await Promise.allSettled(
    subs.map((sub: { endpoint: string; auth_key: string; p256dh_key: string }) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { auth: sub.auth_key, p256dh: sub.p256dh_key } },
        data
      ).catch(err => {
        // Subscription expirée — on la supprime
        if (err.statusCode === 410) {
          admin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
        console.error('[Push]', err.message)
      })
    )
  )
}
