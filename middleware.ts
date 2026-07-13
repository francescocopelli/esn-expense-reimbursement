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

  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in → redirect to login
  if (!user && !request.nextUrl.pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role ?? 'member'

    // /dashboard/admin/* → only admin
    if (request.nextUrl.pathname.startsWith('/dashboard/admin')) {
      if (role !== 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard/my_reimbursement'
        return NextResponse.redirect(url)
      }
    }

    // /dashboard/review* and /dashboard/review_reimbursement* → board or admin only
    // Supervisors are handled at page level (they may access specific project reports)
    if (
      request.nextUrl.pathname.startsWith('/dashboard/review_reimbursement') ||
      request.nextUrl.pathname.startsWith('/dashboard/review')
    ) {
      if (role !== 'board' && role !== 'admin') {
        // Allow if supervisor (project_supervisors check done at page level)
        // Middleware only blocks pure members
        const { data: supervised } = await supabase
          .from('project_supervisors').select('project_id').eq('user_id', user.id).limit(1)
        if (!supervised || supervised.length === 0) {
          const url = request.nextUrl.clone()
          url.pathname = '/dashboard/my_reimbursement'
          return NextResponse.redirect(url)
        }
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
