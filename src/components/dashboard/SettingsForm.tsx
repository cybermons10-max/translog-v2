'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, Check, Loader2 } from 'lucide-react'
import type { Tenant } from '@/types'

interface Props {
  tenant: Tenant
}

export function SettingsForm({ tenant }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [color, setColor] = useState(tenant.primary_color ?? '#1e3a5f')
  const [logoUrl, setLogoUrl] = useState(tenant.logo_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Initialiser le bucket au montage
  useEffect(() => {
    fetch('/api/settings', { method: 'POST' }).catch(() => {})
  }, [])

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo trop lourd (max 2 Mo)')
      return
    }

    setUploading(true)
    setError('')

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${tenant.id}/logo-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setError(`Erreur upload : ${uploadError.message}`)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)
    setLogoUrl(publicUrl)
    setUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError('')

    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ primary_color: color, logo_url: logoUrl || null }),
    })

    setSaving(false)

    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Erreur de sauvegarde')
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color }}>
        Personnalisation
      </h2>

      {/* Logo */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Logo de la société</label>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Upload size={20} className="text-gray-300" />
            )}
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? 'Upload...' : 'Choisir un logo'}
            </button>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG — max 2 Mo</p>
          </div>
        </div>
      </div>

      {/* Couleur primaire */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Couleur principale</label>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer p-0.5"
            />
          </div>
          <div>
            <p className="text-sm font-mono text-gray-700">{color}</p>
            <p className="text-xs text-gray-400 mt-0.5">Header et boutons du dashboard</p>
          </div>
          <div
            className="flex-1 h-10 rounded-lg flex items-center justify-center text-white text-xs font-medium"
            style={{ backgroundColor: color }}
          >
            Aperçu du header
          </div>
        </div>

        {/* Presets */}
        <div className="flex gap-2 flex-wrap">
          {['#1e3a5f','#1a5276','#196f3d','#7d3c98','#b7950b','#922b21','#1b2631'].map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors"
          style={{ backgroundColor: color }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
          {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Sauvegarder'}
        </button>
        {saved && <p className="text-sm text-green-600">Les changements sont appliqués.</p>}
      </div>
    </div>
  )
}
