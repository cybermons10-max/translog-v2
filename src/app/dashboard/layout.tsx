import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = user.app_metadata?.tenant_id
  if (!tenantId) redirect('/login')

  const { data: tenant } = await supabase.from('tenants').select('name, logo_url').eq('id', tenantId).single()

  return (
    <DashboardLayout tenantName={tenant?.name ?? 'Dashboard'} logoUrl={tenant?.logo_url}>
      {children}
    </DashboardLayout>
  )
}
