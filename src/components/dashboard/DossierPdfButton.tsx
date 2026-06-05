'use client'

import { useState } from 'react'
import { FileDown } from 'lucide-react'
import type { Dossier, Tenant } from '@/types'
import { statutLabel, formatMontant } from '@/lib/utils'

interface Props {
  dossier: Dossier
  tenant: Pick<Tenant, 'name' | 'slug'>
}

export function DossierPdfButton({ dossier, tenant }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const PRIMARY = [30, 58, 95] as [number, number, number]
      const LIGHT_BG = [240, 242, 245] as [number, number, number]
      const TEXT = [51, 51, 51] as [number, number, number]
      const GRAY = [120, 120, 120] as [number, number, number]

      const pageW = 210
      const margin = 20

      // Header band
      doc.setFillColor(...PRIMARY)
      doc.rect(0, 0, pageW, 28, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(tenant.name.toUpperCase(), margin, 12)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('Transport France -> Maghreb / Afrique', margin, 19)

      // Title
      doc.setTextColor(...PRIMARY)
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('DEVIS DE TRANSPORT', margin, 40)

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...GRAY)
      doc.text(`Reference : ${dossier.reference}`, margin, 47)
      doc.text(`Date : ${new Date(dossier.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, 53)

      // Separator
      doc.setDrawColor(...PRIMARY)
      doc.setLineWidth(0.5)
      doc.line(margin, 58, pageW - margin, 58)

      // Client block
      doc.setFillColor(...LIGHT_BG)
      doc.roundedRect(margin, 63, 80, 40, 2, 2, 'F')
      doc.setTextColor(...PRIMARY)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text('CLIENT', margin + 5, 71)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...TEXT)
      doc.text(dossier.client_nom, margin + 5, 78)
      doc.text(dossier.client_phone, margin + 5, 85)
      if (dossier.client_email) doc.text(dossier.client_email, margin + 5, 92)

      // Transport block
      doc.setFillColor(...LIGHT_BG)
      doc.roundedRect(pageW / 2, 63, 80, 40, 2, 2, 'F')
      doc.setTextColor(...PRIMARY)
      doc.setFont('helvetica', 'bold')
      doc.text('TRANSPORT', pageW / 2 + 5, 71)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...TEXT)
      doc.text(`Depart : ${dossier.ville_depart} (France)`, pageW / 2 + 5, 78)
      doc.text(`Arrivee : ${dossier.ville_arrivee}`, pageW / 2 + 5, 85)
      doc.text(`Pays : ${dossier.pays_arrivee}`, pageW / 2 + 5, 92)

      // Table
      autoTable(doc, {
        startY: 113,
        head: [['Designation', 'Type', 'Poids', 'Prix HT', 'TVA 20%', 'Prix TTC']],
        body: [[
          dossier.description || 'Envoi de colis',
          dossier.type_colis,
          dossier.poids_kg ? `${dossier.poids_kg} kg` : '-',
          dossier.montant_ht ? `${dossier.montant_ht.toFixed(2)} EUR` : '-',
          dossier.montant_ht ? `${(dossier.montant_ht * 0.2).toFixed(2)} EUR` : '-',
          dossier.montant_ttc ? `${dossier.montant_ttc.toFixed(2)} EUR` : '-',
        ]],
        headStyles: { fillColor: PRIMARY, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: TEXT },
        alternateRowStyles: { fillColor: LIGHT_BG },
        margin: { left: margin, right: margin },
      })

      const finalY = (doc as any).lastAutoTable?.finalY ?? 140

      // Total box
      doc.setFillColor(...PRIMARY)
      doc.roundedRect(pageW - margin - 60, finalY + 8, 60, 20, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('TOTAL TTC', pageW - margin - 55, finalY + 16)
      doc.setFontSize(12)
      doc.text(
        dossier.montant_ttc ? `${dossier.montant_ttc.toFixed(2)} EUR` : 'Sur devis',
        pageW - margin - 55,
        finalY + 24
      )

      // Status
      doc.setTextColor(...GRAY)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(`Statut actuel : ${statutLabel(dossier.statut)}`, margin, finalY + 18)

      // Footer
      doc.setFillColor(...PRIMARY)
      doc.rect(0, 282, pageW, 15, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(7)
      doc.text('Devis genere automatiquement - TransLog V2', pageW / 2, 290, { align: 'center' })

      doc.save(`devis-${dossier.reference}.pdf`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
    >
      <FileDown size={15} />
      {loading ? 'Génération...' : 'Télécharger le devis'}
    </button>
  )
}
