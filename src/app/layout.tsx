import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TransLog V2 — Plateforme logistique France → Maghreb',
  description: 'SaaS multi-tenant pour transporteurs France → Maghreb/Afrique. Gestion de dossiers, devis PDF, suivi client.',
  keywords: ['transport', 'Maroc', 'Algérie', 'Tunisie', 'logistique', 'SaaS'],
  authors: [{ name: 'Cyber Mons' }],
  openGraph: {
    title: 'TransLog V2',
    description: 'La plateforme logistique pour transporteurs France → Maghreb',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TransLog',
  },
}

export const viewport: Viewport = {
  themeColor: '#1e3a5f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
