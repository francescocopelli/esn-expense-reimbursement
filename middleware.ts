import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

type CookieToSet = { name: string; value: string; options?: Partial<ResponseCookie> }

function resolveSupabaseKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) {
    console.error('[middleware] ❌ Missing env var')
    return ''
  }
  return key
}

export async function middleware(request: NextRequest) {
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

  const pathname = request.nextUrl.pathname

  // Always pass through auth routes immediately
  if (pathname.startsWith('/auth')) {
    return supabaseResponse
  }

  // Get user — handle stale/invalid refresh token gracefully
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // If refresh token is invalid/expired, clear cookies and redirect to login
  // This avoids an infinite redirect loop caused by stale browser cookies
  if (authError && (
    authError.message?.includes('Refresh Token Not Found') ||
    authError.message?.includes('refresh_token_not_found') ||
    (authError as any).code === 'refresh_token_not_found'
  )) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    const redirectResponse = NextResponse.redirect(url)
    // Clear all Supabase auth cookies so the browser starts fresh
    request.cookies.getAll().forEach(cookie => {
      if (cookie.name.startsWith('sb-')) {
        redirectResponse.cookies.delete(cookie.name)
      }
    })
    return redirectResponse
  }

  // Not logged in → redirect to login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Role-based checks only for routes that need it
  if (
    pathname.startsWith('/dashboard/admin') ||
    pathname.startsWith('/dashboard/review')
  ) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role ?? 'member'

    if (pathname.startsWith('/dashboard/admin') && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/my_reimbursement'
      return NextResponse.redirect(url)
    }

    if (
      (pathname.startsWith('/dashboard/review_reimbursement') ||
       pathname.startsWith('/dashboard/review')) &&
      role !== 'board' && role !== 'admin'
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/my_reimbursement'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
