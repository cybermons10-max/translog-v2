'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const PAYS_DISPONIBLES = ['Maroc', 'Algérie', 'Tunisie', 'Sénégal', 'Mali', 'Mauritanie', 'Côte d\'Ivoire']

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [selectedPays, setSelectedPays] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function togglePays(pays: string) {
    setSelectedPays(prev =>
      prev.includes(pays) ? prev.filter(p => p !== pays) : [...prev, pays]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        company_name: companyName,
        pays_desservis: selectedPays,
      }),
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      setError(data.error ?? 'Erreur lors de la création du compte')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError('Compte créé mais erreur de connexion. Essayez de vous connecter.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Créer votre espace transporteur</CardTitle>
        <CardDescription>14 jours d'essai gratuit — aucune carte bancaire requise</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">Nom de votre société</Label>
            <Input
              id="company"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Ex: Trans Services Marchita"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email professionnel</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label>Pays desservis</Label>
            <div className="flex flex-wrap gap-2">
              {PAYS_DISPONIBLES.map(pays => (
                <button
                  key={pays}
                  type="button"
                  onClick={() => togglePays(pays)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    selectedPays.includes(pays)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {pays}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Création en cours...' : 'Créer mon espace gratuit'}
          </Button>
          <p className="text-sm text-center text-gray-600">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
