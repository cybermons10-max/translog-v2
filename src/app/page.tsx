import Link from 'next/link'
import { Check, Package, FileText, MapPin, BarChart3, Shield, Zap, ArrowRight } from 'lucide-react'

const PLANS = [
  {
    key: 'starter', label: 'Starter', price: 49, highlight: false,
    desc: 'Pour démarrer votre activité',
    features: ['Gestion des dossiers clients', 'Génération de devis PDF', 'Suivi des statuts', 'Espace client de suivi', '1 admin + 1 transporteur', '14 jours d\'essai gratuit'],
  },
  {
    key: 'pro', label: 'Pro', price: 99, highlight: true,
    desc: 'Pour les sociétés actives',
    features: ['Tout Starter', 'Paiement Stripe intégré', 'GPS temps réel', 'Notifications SMS', 'Multi-transporteurs illimités', 'Dashboard analytiques', '14 jours d\'essai gratuit'],
  },
  {
    key: 'business', label: 'Business', price: 149, highlight: false,
    desc: 'Pour les grandes structures',
    features: ['Tout Pro', 'Multi-agences', 'Marque blanche complète', 'Domaine personnalisé', 'Exports comptables', 'Support prioritaire dédié', '14 jours d\'essai gratuit'],
  },
]

const FEATURES = [
  { icon: Package, title: 'Gestion des dossiers', desc: 'Créez et gérez tous vos dossiers de transport depuis un seul endroit. Statuts en temps réel, notes internes, historique complet.' },
  { icon: FileText, title: 'Devis PDF automatiques', desc: 'Générez des devis professionnels en un clic. Calcul tarifaire automatique basé sur votre grille de prix personnalisée.' },
  { icon: MapPin, title: 'Suivi client', desc: 'Donnez à vos clients un lien de suivi unique. Ils voient la progression de leur colis en temps réel, sans compte requis.' },
  { icon: BarChart3, title: 'Analytics & revenus', desc: 'Visualisez vos revenus, dossiers en cours et performances. Exportez vos données pour la comptabilité.' },
  { icon: Shield, title: 'Sécurité & isolation', desc: 'Chaque transporteur a son propre espace isolé. Données 100% séparées grâce au Row Level Security de Supabase.' },
  { icon: Zap, title: 'Mise en route rapide', desc: 'Votre espace est prêt en 2 minutes. Configurez votre logo, vos tarifs et créez votre premier dossier immédiatement.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      {/* Navbar */}
      <nav style={{ backgroundColor: '#1e3a5f' }} className="px-6 py-4 flex items-center justify-between shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-white font-bold text-lg">TransLog V2</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-white/70 hover:text-white text-sm transition-colors px-3 py-1.5">
            Se connecter
          </Link>
          <Link
            href="/register"
            className="bg-white text-[#1e3a5f] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Essai gratuit
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-6" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #162d4a 60%, #0f1f33 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/80 text-sm">SaaS multi-tenant • Mode test disponible</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-5">
            La plateforme logistique pour<br />
            <span className="text-blue-300">transporteurs France → Maghreb</span>
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Votre espace de gestion branded en 2 minutes. Dossiers clients, devis PDF, suivi temps réel,
            calcul tarifaire automatique — sans intervention technique.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/register"
              className="flex items-center gap-2 bg-white text-[#1e3a5f] font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              Commencer l'essai gratuit
              <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="flex items-center gap-2 border border-white/30 text-white px-6 py-3 rounded-xl hover:bg-white/10 transition-colors">
              Déjà client ? Se connecter
            </Link>
          </div>
          <p className="text-white/40 text-sm mt-5">14 jours gratuits • Aucune CB requise • Annulable à tout moment</p>
        </div>
      </section>

      {/* Stats rapides */}
      <section className="bg-white border-b border-gray-100 py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
          {[
            { val: '< 2 min', label: 'Mise en route' },
            { val: '3 plans', label: 'Starter → Business' },
            { val: '100%', label: 'Isolation des données' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-[#1e3a5f]">{s.val}</p>
              <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-[#1e3a5f]">Tout ce dont vous avez besoin</h2>
            <p className="text-gray-500 mt-2">Conçu spécifiquement pour les transporteurs France → Maghreb / Afrique</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-[#f0f4ff] flex items-center justify-center mb-3">
                  <Icon size={20} className="text-[#1e3a5f]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-[#1e3a5f]">Tarifs transparents</h2>
            <p className="text-gray-500 mt-2">14 jours d'essai gratuit sur tous les plans • Paiement mensuel • Sans engagement</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div
                key={plan.key}
                className={`rounded-2xl border-2 p-6 relative flex flex-col ${
                  plan.highlight
                    ? 'border-[#1e3a5f] bg-[#f8faff] shadow-lg scale-[1.02]'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1e3a5f] text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Le plus populaire
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-[#1e3a5f]">{plan.label}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{plan.desc}</p>
                  <div className="mt-3">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-400 text-sm"> €/mois</span>
                  </div>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`w-full py-3 rounded-xl text-sm font-semibold text-center transition-colors ${
                    plan.highlight
                      ? 'bg-[#1e3a5f] text-white hover:bg-[#162d4a]'
                      : 'border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#f0f4ff]'
                  }`}
                >
                  Démarrer l'essai gratuit
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section style={{ backgroundColor: '#1e3a5f' }} className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Prêt à digitaliser votre activité ?</h2>
          <p className="text-white/60 mb-8">Rejoignez les transporteurs qui font confiance à TransLog V2.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-[#1e3a5f] font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
          >
            Créer mon espace gratuit
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-6 px-6 text-center text-gray-500 text-xs">
        <p>TransLog V2 — SaaS logistique France → Maghreb/Afrique</p>
        <p className="mt-1">
          <a href="mailto:support@cybermons.fr" className="hover:text-gray-300 transition-colors">support@cybermons.fr</a>
          {' · '}
          <Link href="/login" className="hover:text-gray-300 transition-colors">Connexion</Link>
          {' · '}
          <Link href="/register" className="hover:text-gray-300 transition-colors">Inscription</Link>
        </p>
      </footer>
    </div>
  )
}
