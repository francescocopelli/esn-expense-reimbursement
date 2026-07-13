import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

type CookieToSet = { name: string; value: string; options?: Partial<ResponseCookie> }

function resolveSupabaseKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) {
    console.error('[middleware] ❌ Missing env var: set either NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')
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

  // Always allow auth routes through — never block /auth/* (login, register, callback)
  if (pathname.startsWith('/auth')) {
    return supabaseResponse
  }

  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in → redirect to login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Role-based checks only for dashboard routes that need it
  if (
    pathname.startsWith('/dashboard/admin') ||
    pathname.startsWith('/dashboard/review')
  ) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role ?? 'member'

    // /dashboard/admin/* → only admin
    if (pathname.startsWith('/dashboard/admin') && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/my_reimbursement'
      return NextResponse.redirect(url)
    }

    // /dashboard/review* → board or admin only
    // Note: supervisor scope is validated at page level, not middleware
    // (project_supervisors has no RLS policy — cannot query here safely)
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
