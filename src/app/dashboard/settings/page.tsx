import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Tenant } from '@/types'
import { SettingsForm } from '@/components/dashboard/SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = user.app_metadata?.tenant_id
  if (!tenantId) redirect('/login')

  const { data: tenant } = await supabase.from('tenants').select('*').eq('id', tenantId).single()
  const t = tenant as Tenant

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://translog-v2.vercel.app'

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-xl font-bold text-[#1e3a5f]">Paramètres</h1>

      {/* Infos société */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#1e3a5f] uppercase tracking-wide">Informations société</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Nom société</p>
            <p className="font-medium text-gray-800">{t?.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Identifiant (slug)</p>
            <p className="font-mono text-gray-600">{t?.slug}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Pays desservis</p>
            <p className="text-gray-700">{t?.pays_desservis?.join(', ') || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Abonnement</p>
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
              t?.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
              t?.subscription_status === 'trial'  ? 'bg-blue-100 text-blue-700' :
              'bg-red-100 text-red-700'
            }`}>
              {t?.subscription_status} — {t?.plan}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
          Pour modifier le nom ou les pays desservis : <a href="mailto:support@cybermons.fr" className="text-[#1e3a5f] hover:underline">support@cybermons.fr</a>
        </p>
      </div>

      {/* Logo + Couleur */}
      <SettingsForm tenant={t} />

      {/* Lien client */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
        <h2 className="text-sm font-semibold text-[#1e3a5f] uppercase tracking-wide">Lien de suivi client</h2>
        <p className="text-sm text-gray-600">Partagez ce lien à vos clients pour suivre leur colis :</p>
        <code className="block bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono text-[#1e3a5f]">
          {appUrl}/client
        </code>
      </div>
    </div>
  )
}
