'use client'

import { Download } from 'lucide-react'
import type { Dossier } from '@/types'
import { statutLabel } from '@/lib/utils'

interface Props {
  dossiers: Dossier[]
}

export function CsvExportButton({ dossiers }: Props) {
  function handleExport() {
    if (!dossiers.length) return

    const headers = ['Référence', 'Client', 'Téléphone', 'Email', 'Type', 'Poids (kg)', 'Départ', 'Arrivée', 'Pays', 'Statut', 'Montant HT (€)', 'Montant TTC (€)', 'Date']
    const rows = dossiers.map(d => [
      d.reference,
      d.client_nom,
      d.client_phone,
      d.client_email ?? '',
      d.type_colis,
      d.poids_kg?.toString() ?? '',
      d.ville_depart,
      d.ville_arrivee,
      d.pays_arrivee,
      statutLabel(d.statut),
      d.montant_ht?.toFixed(2) ?? '',
      d.montant_ttc?.toFixed(2) ?? '',
      new Date(d.created_at).toLocaleDateString('fr-FR'),
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dossiers-${new Date().toISOString().slice(0, 7)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      disabled={!dossiers.length}
      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
    >
      <Download size={15} />
      Exporter CSV du mois ({dossiers.length})
    </button>
  )
}
