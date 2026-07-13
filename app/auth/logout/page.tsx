/**
 * /auth/logout — server-side logout entrypoint.
 * Navigate here (or POST /api/auth/logout) to sign out.
 * This page is bypassed by middleware (pathname.startsWith('/auth')).
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'

export default async function LogoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  Sentry.addBreadcrumb({
    category: 'auth',
    message: `Logout initiated for user ${user?.id ?? 'unknown'}`,
    level: 'info',
    data: { userId: user?.id },
  })

  await supabase.auth.signOut()

  Sentry.setUser(null)
  Sentry.addBreadcrumb({
    category: 'auth',
    message: 'signOut() completed — redirecting to /auth/login',
    level: 'info',
  })

  redirect('/auth/login')
}
