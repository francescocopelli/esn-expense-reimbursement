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

export async function middleware(request: NextRequest) {
  // IMPORTANT: supabaseResponse must always be returned (not a fresh NextResponse.next())
  // so that refreshed session cookies are forwarded to the browser.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    resolveSupabaseKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          // Step 1: write onto the request (so subsequent getAll() sees them)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Step 2: rebuild supabaseResponse so it carries the new cookies
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  // Always pass /auth/* through immediately — do NOT call getUser() here
  if (pathname.startsWith('/auth')) {
    return supabaseResponse
  }

  // getUser() refreshes the session and writes updated cookies via setAll above
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  console.log(`[middleware] ${pathname} user=${user?.id ?? 'null'} err=${authError?.message ?? 'none'}`)

  // Stale/invalid refresh token — clear cookies and send to login
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

  // Not authenticated → login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    // IMPORTANT: return supabaseResponse-based redirect so cookies are preserved
    const res = NextResponse.redirect(url)
    // Copy any cookies that supabase set (e.g. cleared tokens)
    supabaseResponse.cookies.getAll().forEach(c =>
      res.cookies.set(c.name, c.value, c as any)
    )
    return res
  }

  // Role-based checks for restricted routes
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

  // CRITICAL: return supabaseResponse, NOT NextResponse.next()
  // This ensures refreshed auth cookies are sent to the browser
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
