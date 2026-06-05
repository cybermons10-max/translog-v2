import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const publicPaths = ['/login', '/register', '/auth/callback', '/suspended', '/client', '/api/client']
  const isPublic = publicPaths.some(p => pathname.startsWith(p))

  if (!user) {
    if (isPublic) return supabaseResponse
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const meta = user.app_metadata as {
    role?: string
    subscription_status?: string
    trial_ends_at?: string
  }

  const role = meta?.role
  const status = meta?.subscription_status
  const trialEndsAt = meta?.trial_ends_at

  const isSuspended =
    status === 'suspended' ||
    status === 'cancelled' ||
    (status === 'trial' && trialEndsAt && new Date(trialEndsAt) < new Date())

  if (role === 'superadmin') {
    if (pathname.startsWith('/superadmin')) return supabaseResponse
    return NextResponse.redirect(new URL('/superadmin', request.url))
  }

  if (role === 'tenant_admin' || role === 'tenant_staff') {
    if (isSuspended && !pathname.startsWith('/suspended')) {
      return NextResponse.redirect(new URL('/suspended', request.url))
    }
    if (!isSuspended && pathname.startsWith('/dashboard')) return supabaseResponse
    if (!isSuspended && !pathname.startsWith('/suspended')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  if (role === 'client') {
    if (pathname.startsWith('/client')) return supabaseResponse
    return NextResponse.redirect(new URL('/client', request.url))
  }

  return NextResponse.redirect(new URL('/login', request.url))
}
