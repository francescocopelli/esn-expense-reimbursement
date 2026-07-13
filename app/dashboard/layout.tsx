import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import DashboardNavbarWrapper from '@/components/DashboardNavbarWrapper'
import EsnFooter from '@/components/EsnFooter'
import * as Sentry from '@sentry/nextjs'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  Sentry.addBreadcrumb({
    category: 'layout',
    message: `DashboardLayout: getUser result`,
    level: 'info',
    data: { userId: user?.id ?? null, error: userError?.message ?? null },
  })

  if (!user) {
    Sentry.captureMessage('[ESN] DashboardLayout: unauthenticated access', {
      level: 'warning',
      extra: { error: userError?.message },
      tags: { context: 'dashboard_layout', event: 'no_user' },
    })
    redirect('/auth/login')
  }

  // Always use adminClient to bypass RLS on profiles
  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles').select('*').eq('id', user!.id).single()

  Sentry.addBreadcrumb({
    category: 'layout',
    message: `DashboardLayout: profile fetch`,
    level: 'info',
    data: {
      userId: user!.id,
      found: !!profile,
      role: profile?.role ?? null,
      errorCode: profileError?.code ?? null,
      errorMessage: profileError?.message ?? null,
    },
  })

  if (!profile) {
    Sentry.captureMessage('[ESN] DashboardLayout: profile not found', {
      level: 'error',
      extra: {
        userId: user!.id,
        errorCode: profileError?.code,
        errorMessage: profileError?.message,
        errorDetails: profileError?.details,
        errorHint: profileError?.hint,
      },
      tags: { context: 'dashboard_layout', event: 'profile_missing' },
    })
    redirect('/auth/login')
  }

  Sentry.setUser({ id: user!.id })
  Sentry.addBreadcrumb({
    category: 'layout',
    message: `DashboardLayout: rendering for role=${profile!.role}`,
    level: 'info',
    data: { userId: user!.id, role: profile!.role },
  })

  return (
    <>
      <DashboardNavbarWrapper profile={profile!} />
      <main>{children}</main>
      <EsnFooter />
    </>
  )
}
