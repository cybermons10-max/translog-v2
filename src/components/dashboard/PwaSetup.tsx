'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Smartphone } from 'lucide-react'

export function PwaSetup() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [pushState, setPushState] = useState<'unknown' | 'denied' | 'granted' | 'subscribed'>('unknown')
  const [pushLoading, setPushLoading] = useState(false)

  useEffect(() => {
    // Service worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Push state
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(reg => {
          reg.pushManager.getSubscription().then(sub => {
            setPushState(sub ? 'subscribed' : 'granted')
          })
        })
      } else {
        setPushState(Notification.permission as 'denied' | 'granted')
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    await installPrompt.prompt()
    setInstallPrompt(null)
  }

  async function handlePushToggle() {
    if (pushLoading || !('serviceWorker' in navigator)) return
    setPushLoading(true)

    try {
      if (pushState === 'subscribed') {
        // Désabonner
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
          await sub.unsubscribe()
        }
        setPushState('granted')
      } else {
        // Demander permission + abonner
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') { setPushState('denied'); return }

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) return

        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint, keys: { auth: arrayBufferToBase64(sub.getKey('auth')!), p256dh: arrayBufferToBase64(sub.getKey('p256dh')!) } }),
        })
        setPushState('subscribed')
      }
    } catch (err) {
      console.error('[PwaSetup]', err)
    } finally {
      setPushLoading(false)
    }
  }

  if (pushState === 'unknown' && !installPrompt) return null

  return (
    <div className="flex items-center gap-2">
      {installPrompt && (
        <button
          onClick={handleInstall}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs transition-colors"
          title="Installer l'application"
        >
          <Smartphone size={13} />
          Installer
        </button>
      )}
      {pushState !== 'unknown' && pushState !== 'denied' && (
        <button
          onClick={handlePushToggle}
          disabled={pushLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs transition-colors disabled:opacity-50"
          title={pushState === 'subscribed' ? 'Désactiver les notifications' : 'Activer les notifications'}
        >
          {pushState === 'subscribed' ? <Bell size={13} /> : <BellOff size={13} />}
          {pushLoading ? '...' : pushState === 'subscribed' ? 'Notifs ON' : 'Notifs'}
        </button>
      )}
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// Type global pour beforeinstallprompt
declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }
}
