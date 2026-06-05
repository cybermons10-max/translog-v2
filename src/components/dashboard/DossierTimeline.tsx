import { STATUT_ORDER, STATUT_CONFIG } from '@/types'
import type { DossierStatut } from '@/types'
import { Check } from 'lucide-react'

interface Props {
  current: DossierStatut
}

export function DossierTimeline({ current }: Props) {
  if (current === 'annule') {
    return (
      <div className="flex items-center gap-2 py-2">
        <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
          Dossier annulé
        </span>
      </div>
    )
  }

  const currentIdx = STATUT_ORDER.indexOf(current)

  return (
    <div className="flex items-center gap-0">
      {STATUT_ORDER.map((s, i) => {
        const cfg = STATUT_CONFIG[s]
        const done = i < currentIdx
        const active = i === currentIdx
        const future = i > currentIdx

        return (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                done   ? 'bg-[#1e3a5f] border-[#1e3a5f]' :
                active ? 'bg-white border-[#1e3a5f] ring-4 ring-[#1e3a5f]/20' :
                         'bg-white border-gray-200'
              }`}>
                {done ? (
                  <Check size={14} className="text-white" strokeWidth={3} />
                ) : (
                  <div className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-[#1e3a5f]' : 'bg-gray-200'}`} />
                )}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${
                done || active ? 'text-[#1e3a5f]' : 'text-gray-400'
              }`}>
                {cfg.label}
              </span>
            </div>
            {i < STATUT_ORDER.length - 1 && (
              <div className={`h-0.5 w-12 mb-5 mx-1 ${i < currentIdx ? 'bg-[#1e3a5f]' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
