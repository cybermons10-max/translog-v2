'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { STATUT_CONFIG, STATUT_ORDER } from '@/types'
import type { DossierStatut } from '@/types'

interface Props {
  dossierId: string
  current: DossierStatut
}

const ALL_STATUTS: DossierStatut[] = ['recu', 'confirme', 'en_transit', 'arrive', 'livre', 'annule']

export function StatutSelect({ dossierId, current }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatut = e.target.value as DossierStatut
    setLoading(true)
    await fetch(`/api/dossiers/${dossierId}/statut`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: newStatut }),
    })
    setLoading(false)
    router.refresh()
  }

  const cfg = STATUT_CONFIG[current]

  return (
    <div className="flex items-center gap-3">
      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${cfg.bg} ${cfg.text}`}>
        {cfg.label}
      </span>
      <select
        value={current}
        onChange={handleChange}
        disabled={loading}
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 disabled:opacity-50"
      >
        {ALL_STATUTS.map(s => (
          <option key={s} value={s}>{STATUT_CONFIG[s].label}</option>
        ))}
      </select>
    </div>
  )
}
