import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

type CookieToSet = { name: string; value: string; options?: Partial<ResponseCookie> }

function resolveSupabaseKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ''
  )
}

// Routes accessible without authentication
const PUBLIC_PATHS = ['/', '/auth']

// API routes that require the user to be authenticated
// (each route still does its own role check, but at least a valid session is required)
const PROTECTED_API_PREFIXES = ['/api/reports', '/api/requests', '/api/admin', '/api/projects']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p =>
    p === '/' ? pathname === '/' : pathname.startsWith(p)
  )
}

async function buildSupabaseClient(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    resolveSupabaseKey(),
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  return { supabase, get supabaseResponse() { return supabaseResponse } }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Public paths bypass auth entirely
  if (isPublicPath(pathname)) {
    const { supabaseResponse } = await buildSupabaseClient(request)
    return supabaseResponse
  }

  // Unprotected API routes (sentry-tunnel, public/*) — skip auth
  if (pathname.startsWith('/api/') && !PROTECTED_API_PREFIXES.some(p => pathname.startsWith(p))) {
    const { supabaseResponse } = await buildSupabaseClient(request)
    return supabaseResponse
  }

  // All other routes (dashboard + protected API) — require a valid session
  const { supabase, supabaseResponse } = await buildSupabaseClient(request)
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  console.log(
    `[middleware] ${request.method} ${pathname}`,
    `user=${user?.id ?? 'null'}`,
    `err=${authError?.message ?? 'none'}`
  )

  // Stale refresh token — clear sb- cookies and redirect to login
  if (
    authError &&
    (authError.message?.includes('Refresh Token Not Found') ||
      (authError as any).code === 'refresh_token_not_found')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    const res = NextResponse.redirect(url)
    request.cookies.getAll().forEach(c => {
      if (c.name.startsWith('sb-')) res.cookies.delete(c.name)
    })
    return res
  }

  if (!user) {
    // API routes: return 401 instead of redirecting
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(c =>
      res.cookies.set(c.name, c.value, c as any)
    )
    return res
  }

  // Role gating is handled server-side by each layout/page (using adminClient).
  // The middleware only guarantees the user is authenticated.
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
