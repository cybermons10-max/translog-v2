import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TransLog V2 — Gestion de transport',
    short_name: 'TransLog',
    description: 'Plateforme SaaS multi-tenant pour transporteurs France → Maghreb/Afrique',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f0f2f5',
    theme_color: '#1e3a5f',
    orientation: 'portrait',
    categories: ['business', 'logistics'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Nouveau dossier',
        url: '/dashboard/dossiers',
        description: 'Créer un nouveau dossier de transport',
      },
      {
        name: 'Suivi colis',
        url: '/client',
        description: 'Suivre un colis par référence',
      },
    ],
  }
}
