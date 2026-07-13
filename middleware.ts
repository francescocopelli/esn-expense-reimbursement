import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
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

/** Lightweight admin client for role lookup — bypasses RLS. */
function resolveAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createSupabaseAdmin(url, key, { auth: { persistSession: false } })
}

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  // Pass auth pages and ALL API routes through without session check.
  if (pathname.startsWith('/auth') || pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  console.log(`[middleware] ${pathname} user=${user?.id ?? 'null'} err=${authError?.message ?? 'none'}`)

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
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(c =>
      res.cookies.set(c.name, c.value, c as any)
    )
    return res
  }

  if (
    pathname.startsWith('/dashboard/admin') ||
    pathname.startsWith('/dashboard/review')
  ) {
    // Use adminClient (service role) to bypass RLS — the anon client returns null
    // for profiles rows when the user cookie context isn't fully established yet.
    const admin = resolveAdminClient()
    const { data: profile } = await admin
      .from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role ?? 'member'

    console.log(`[middleware] role check for ${pathname}: userId=${user.id} role=${role}`)

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
