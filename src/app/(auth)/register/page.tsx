'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'

const PAYS_DISPONIBLES = ['Maroc', 'Algérie', 'Tunisie', 'Sénégal', 'Mali', 'Mauritanie', "Côte d'Ivoire"]

const PLANS_DISPLAY = [
  { key: 'starter', label: 'Starter', price: 49, highlight: false, features: ['Dossiers & devis', 'Espace client', '1 admin + 1 transporteur'] },
  { key: 'pro',     label: 'Pro',     price: 99, highlight: true,  features: ['Tout Starter', 'GPS, SMS, Stripe', 'Multi-transporteurs'] },
  { key: 'business',label: 'Business',price: 149,highlight: false, features: ['Tout Pro', 'Multi-agences', 'Marque blanche'] },
]

export default function RegisterPage() {
  const [step, setStep] = useState<'info' | 'plan'>('info')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [selectedPays, setSelectedPays] = useState<string[]>([])
  const [selectedPlan, setSelectedPlan] = useState('starter')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function togglePays(pays: string) {
    setSelectedPays(prev => prev.includes(pays) ? prev.filter(p => p !== pays) : [...prev, pays])
  }

  async function handleInfoSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStep('plan')
  }

  async function handleCheckout() {
    setLoading(true)
    setError('')

    // 1. Créer le compte
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, company_name: companyName, pays_desservis: selectedPays }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      setError(data.error ?? 'Erreur lors de la création du compte')
      setLoading(false)
      setStep('info')
      return
    }

    // 2. Se connecter
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError('Compte créé, erreur de connexion. Connectez-vous manuellement.')
      setLoading(false)
      return
    }

    // 3. Rediriger vers Stripe Checkout
    const checkoutRes = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: selectedPlan }),
    })
    const { url, error: stripeError } = await checkoutRes.json()
    if (stripeError || !url) {
      // Stripe indisponible → aller au dashboard directement (trial actif)
      window.location.href = '/dashboard'
      return
    }

    window.location.href = url
  }

  return (
    <div className="w-full">
      {step === 'info' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Créer votre espace transporteur</CardTitle>
            <CardDescription>14 jours d'essai gratuit — choisissez votre plan ensuite</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInfoSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">Nom de votre société</Label>
                <Input id="company" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ex: Trans Services Marchita" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email professionnel</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
              </div>
              <div className="space-y-2">
                <Label>Pays desservis</Label>
                <div className="flex flex-wrap gap-2">
                  {PAYS_DISPONIBLES.map(pays => (
                    <button key={pays} type="button" onClick={() => togglePays(pays)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${selectedPays.includes(pays) ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-700 border-gray-300 hover:border-[#1e3a5f]'}`}>
                      {pays}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-lg text-white font-medium" style={{ backgroundColor: '#1e3a5f' }}>
                Continuer →
              </button>
              <p className="text-sm text-center text-gray-600">
                Déjà un compte ?{' '}
                <Link href="/login" className="text-[#1e3a5f] hover:underline">Se connecter</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#1e3a5f]">Choisissez votre plan</h2>
            <p className="text-gray-500 text-sm mt-1">14 jours d'essai gratuit sur tous les plans • Annulable à tout moment</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {PLANS_DISPLAY.map(p => (
              <button key={p.key} type="button" onClick={() => setSelectedPlan(p.key)}
                className={`relative rounded-xl border-2 p-4 text-left transition-all ${selectedPlan === p.key ? 'border-[#1e3a5f]' : 'border-gray-200 bg-white hover:border-gray-300'} ${p.highlight ? 'bg-[#f0f4ff]' : 'bg-white'}`}>
                {p.highlight && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#1e3a5f] text-white text-xs px-2 py-0.5 rounded-full">Populaire</span>}
                <p className="font-bold text-[#1e3a5f]">{p.label}</p>
                <p className="text-2xl font-bold mt-1">{p.price}<span className="text-sm font-normal text-gray-400">€/mois</span></p>
                <ul className="mt-3 space-y-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Check size={11} className="text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {selectedPlan === p.key && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#1e3a5f] flex items-center justify-center">
                    <Check size={11} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <div className="flex gap-3">
            <button onClick={() => setStep('info')} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              ← Retour
            </button>
            <button onClick={handleCheckout} disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-white font-medium disabled:opacity-50"
              style={{ backgroundColor: '#1e3a5f' }}>
              {loading ? 'Redirection...' : 'Démarrer l\'essai gratuit →'}
            </button>
          </div>
          <p className="text-xs text-center text-gray-400">Paiement sécurisé par Stripe • Pas de CB requise pendant l'essai</p>
        </div>
      )}
    </div>
  )
}
