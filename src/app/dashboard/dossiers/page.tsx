import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatMontant, statutLabel, statutColor } from '@/lib/utils'
import type { Dossier } from '@/types'

export default async function DossiersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = user.app_metadata?.tenant_id
  if (!tenantId) redirect('/login')

  const { data: dossiers } = await supabase
    .from('dossiers')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dossiers</h1>
          <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</a>
        </div>
        <Card>
          <CardContent className="pt-4">
            {!dossiers?.length ? (
              <p className="text-gray-500 text-sm text-center py-8">Aucun dossier</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Colis</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">TTC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(dossiers as Dossier[]).map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-sm">{d.reference}</TableCell>
                      <TableCell>{d.client_nom}</TableCell>
                      <TableCell>{d.client_phone}</TableCell>
                      <TableCell className="capitalize">{d.type_colis}</TableCell>
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
      </div>
    </div>
  )
}
