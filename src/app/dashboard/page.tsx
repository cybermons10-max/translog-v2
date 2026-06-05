import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatMontant, statutLabel, statutColor } from '@/lib/utils'
import type { Dossier, Tenant } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = user.app_metadata?.tenant_id
  if (!tenantId) redirect('/login')

  const [{ data: tenant }, { data: dossiers }, { data: allDossiers }] = await Promise.all([
    supabase.from('tenants').select('*').eq('id', tenantId).single(),
    supabase.from('dossiers').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(10),
    supabase.from('dossiers').select('id, statut, montant_ttc, created_at').eq('tenant_id', tenantId),
  ])

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const totalDossiers = allDossiers?.length ?? 0
  const dossiersEnCours = allDossiers?.filter(d => ['confirme', 'en_transit', 'arrive'].includes(d.statut)).length ?? 0
  const revenusMois = allDossiers
    ?.filter(d => d.created_at >= startOfMonth && d.montant_ttc)
    .reduce((sum, d) => sum + (d.montant_ttc ?? 0), 0) ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {(tenant as Tenant)?.logo_url && (
            <img src={(tenant as Tenant).logo_url!} alt="Logo" className="h-8 w-8 rounded object-cover" />
          )}
          <h1 className="text-xl font-bold text-gray-900">{(tenant as Tenant)?.name ?? 'Dashboard'}</h1>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button className="text-sm text-gray-500 hover:text-gray-700">Déconnexion</button>
        </form>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total dossiers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalDossiers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">En cours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{dossiersEnCours}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Revenus ce mois</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{formatMontant(revenusMois)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Derniers dossiers</CardTitle>
          </CardHeader>
          <CardContent>
            {!dossiers?.length ? (
              <p className="text-gray-500 text-sm text-center py-8">Aucun dossier pour l'instant</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Montant TTC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(dossiers as Dossier[]).map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-sm">{d.reference}</TableCell>
                      <TableCell>{d.client_nom}</TableCell>
                      <TableCell>{d.ville_arrivee}, {d.pays_arrivee}</TableCell>
                      <TableCell>
                        <Badge variant={statutColor(d.statut) as any}>{statutLabel(d.statut)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatMontant(d.montant_ttc)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
