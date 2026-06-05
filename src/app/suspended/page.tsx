import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SuspendedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-4">
        <div className="text-6xl mb-4">⛔</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Abonnement suspendu</h1>
        <p className="text-gray-600 mb-6">
          Votre accès à TransLog V2 a été suspendu. Pour réactiver votre compte ou
          obtenir de l'aide, contactez notre support.
        </p>
        <a
          href="mailto:support@cybermons.fr"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          support@cybermons.fr
        </a>
      </div>
    </div>
  )
}
