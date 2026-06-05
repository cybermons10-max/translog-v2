'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderOpen, Tag, Settings, LogOut, CreditCard, BarChart3 } from 'lucide-react'
import { PwaSetup } from '@/components/dashboard/PwaSetup'

interface Props {
  children: React.ReactNode
  tenantName: string
  logoUrl?: string | null
  primaryColor?: string | null
}

const NAV = [
  { href: '/dashboard',           label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/dossiers',  label: 'Dossiers',        icon: FolderOpen },
  { href: '/dashboard/analytics', label: 'Analytics',       icon: BarChart3 },
  { href: '/dashboard/tarifs',    label: 'Tarifs',          icon: Tag },
  { href: '/dashboard/billing',   label: 'Abonnement',      icon: CreditCard },
  { href: '/dashboard/settings',  label: 'Paramètres',      icon: Settings },
]

export function DashboardLayout({ children, tenantName, logoUrl, primaryColor }: Props) {
  const pathname = usePathname()
  const brand = primaryColor ?? '#1e3a5f'
  // Nav is slightly darker — darken by mixing with black at 15%
  const navBg = brand

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f2f5' }}>
      {/* Header */}
      <header style={{ backgroundColor: brand }} className="px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="h-9 w-9 rounded-lg object-cover bg-white/10" />
          )}
          <span className="text-white font-bold text-lg tracking-wide">{tenantName}</span>
        </div>
        <div className="flex items-center gap-3">
          <PwaSetup />
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors"
            >
              <LogOut size={15} />
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      {/* Nav */}
      <nav style={{ backgroundColor: brand, filter: 'brightness(0.88)' }} className="px-6 flex gap-1 shadow">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                active
                  ? 'text-white border-white'
                  : 'text-white/60 border-transparent hover:text-white/90 hover:border-white/40'
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}
