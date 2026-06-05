'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderOpen, Tag, Settings, LogOut, CreditCard } from 'lucide-react'

interface Props {
  children: React.ReactNode
  tenantName: string
  logoUrl?: string | null
  subscriptionStatus?: string
}

const NAV = [
  { href: '/dashboard',          label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/dossiers', label: 'Dossiers',        icon: FolderOpen },
  { href: '/dashboard/tarifs',   label: 'Tarifs',          icon: Tag },
  { href: '/dashboard/billing',  label: 'Abonnement',      icon: CreditCard },
  { href: '/dashboard/settings', label: 'Paramètres',      icon: Settings },
]

export function DashboardLayout({ children, tenantName, logoUrl, subscriptionStatus }: Props) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f2f5' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#1e3a5f' }} className="px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="h-9 w-9 rounded-lg object-cover" />
          )}
          <span className="text-white font-bold text-lg tracking-wide">{tenantName}</span>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors"
          >
            <LogOut size={15} />
            Déconnexion
          </button>
        </form>
      </header>

      {/* Nav */}
      <nav style={{ backgroundColor: '#162d4a' }} className="px-6 flex gap-1 shadow">
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
