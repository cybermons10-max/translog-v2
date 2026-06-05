import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Tenant } from '@/types'
import { TenantActions } from '@/components/superadmin/TenantActions'

export default async function SuperadminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'superadmin') redirect('/login')

  const adminClient = createAdminClient()

  const [{ data: tenants }, { data: allDossiers }] = await Promise.all([
    adminClient.from('tenants').select('*').order('created_at', { ascending: false }),
    adminClient.from('dossiers').select('tenant_id'),
  ])

  const dossierCountByTenant: Record<string, number> = {}
  for (const d of (allDossiers ?? []) as { tenant_id: string }[]) {
    dossierCountByTenant[d.tenant_id] = (dossierCountByTenant[d.tenant_id] ?? 0) + 1
  }

  const activeCount = (tenants as Tenant[] ?? []).filter((t: Tenant) => t.subscription_status === 'active').length
  const trialCount = (tenants as Tenant[] ?? []).filter((t: Tenant) => t.subscription_status === 'trial').length

  function statusBadgeVariant(status: string) {
    if (status === 'active') return 'default'
    if (status === 'trial') return 'secondary'
    if (status === 'suspended') return 'destructive'
    return 'outline'
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">TransLog V2 — Superadmin</h1>
        <span className="text-sm text-gray-400">cybermons10@gmail.com</span>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Tenants actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-400">{activeCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">En essai</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-400">{trialCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total dossiers plateforme</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{allDossiers?.length ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle>Tous les tenants ({tenants?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-400">Société</TableHead>
                  <TableHead className="text-gray-400">Slug</TableHead>
                  <TableHead className="text-gray-400">Plan</TableHead>
                  <TableHead className="text-gray-400">Statut</TableHead>
                  <TableHead className="text-gray-400">Dossiers</TableHead>
                  <TableHead className="text-gray-400">Créé le</TableHead>
                  <TableHead className="text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tenants as Tenant[] ?? []).map(t => (
                  <TableRow key={t.id} className="border-gray-700">
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="font-mono text-sm text-gray-400">{t.slug}</TableCell>
                    <TableCell className="capitalize">{t.plan}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(t.subscription_status) as any}>
                        {t.subscription_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{dossierCountByTenant[t.id] ?? 0}</TableCell>
                    <TableCell className="text-gray-400">
                      {new Date(t.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <TenantActions tenantId={t.id} currentStatus={t.subscription_status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
