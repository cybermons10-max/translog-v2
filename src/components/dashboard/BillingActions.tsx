'use client'

import { useState } from 'react'
import type { PlanKey } from '@/lib/stripe'

type Props =
  | { mode: 'checkout'; plan: PlanKey; label: string }
  | { mode: 'portal' }

export function BillingActions(props: Props) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)

    if (props.mode === 'portal') {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    } else {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: props.plan }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    }

    setLoading(false)
  }

  if (props.mode === 'portal') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        {loading ? '...' : 'Gérer l\'abonnement'}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors"
      style={{ backgroundColor: '#1e3a5f' }}
    >
      {loading ? 'Redirection...' : props.label}
    </button>
  )
}
