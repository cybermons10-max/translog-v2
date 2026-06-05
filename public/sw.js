const CACHE_VERSION = 'translog-v1'
const STATIC_CACHE = ['/login', '/register', '/client', '/manifest.webmanifest']

// Install — pré-cache les pages statiques
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(STATIC_CACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  )
})

// Activate — nettoie les anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// Fetch — network-first, fallback cache pour les pages statiques
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  if (event.request.url.includes('/api/')) return

  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  )
})

// Push notifications
self.addEventListener('push', event => {
  if (!event.data) return

  let payload = { title: 'TransLog', body: 'Nouvelle notification', url: '/', tag: 'translog' }
  try { payload = { ...payload, ...event.data.json() } } catch {}

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      tag: payload.tag,
      data: { url: payload.url },
      vibrate: [100, 50, 100],
    })
  )
})

// Click sur notification — ouvre l'URL cible
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/dashboard'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        const existing = clients.find(c => c.url.includes(url))
        if (existing) return existing.focus()
        return self.clients.openWindow(url)
      })
  )
})
