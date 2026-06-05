'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Props {
  tenantId: string
  currentStatus: string
}

export function TenantActions({ tenantId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggleStatus() {
    setLoading(true)
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended'
    await fetch('/api/superadmin/tenant-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, status: newStatus }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <Button
      variant={currentStatus === 'suspended' ? 'default' : 'destructive'}
      size="sm"
      onClick={toggleStatus}
      disabled={loading}
    >
      {loading ? '...' : currentStatus === 'suspended' ? 'Activer' : 'Suspendre'}
    </Button>
  )
}
