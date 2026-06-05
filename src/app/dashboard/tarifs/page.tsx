import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Tarif } from '@/types'
import { TYPE_COLIS_OPTIONS, PAYS_OPTIONS } from '@/types'
import { TarifsManager } from '@/components/dashboard/TarifsManager'

export default async function TarifsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = user.app_metadata?.tenant_id
  if (!tenantId) redirect('/login')

  const { data: tarifs } = await supabase
    .from('tarifs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('type_colis')
    .order('poids_min_kg')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1e3a5f]">Grille tarifaire</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configurez vos tarifs par type de colis, poids et destination</p>
        </div>
      </div>
      <TarifsManager tarifs={(tarifs as Tarif[]) ?? []} tenantId={tenantId} />
    </div>
  )
}
