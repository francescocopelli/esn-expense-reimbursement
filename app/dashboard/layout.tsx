import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import DashboardNavbarWrapper from '@/components/DashboardNavbarWrapper'
import EsnFooter from '@/components/EsnFooter'
import * as Sentry from '@sentry/nextjs'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (!user) {
    console.error('[layout] getUser failed:', userError?.message)
    redirect('/auth/login')
  }

  const admin = createAdminClient()

  // Use adminClient to bypass RLS on profiles table
  const { data: profile, error: profileError } = await admin
    .from('profiles').select('*').eq('id', user!.id).single()

  if (!profile) {
    Sentry.captureMessage('[ESN] Layout: profile not found', {
      level: 'error',
      extra: {
        userId: user!.id,
        errorCode: profileError?.code,
        errorMessage: profileError?.message,
      },
      tags: { context: 'dashboard_layout', event: 'profile_missing' },
    })
    console.error('[layout] profile not found for user', user!.id, profileError)
    redirect('/auth/login')
  }

  return (
    <>
      <DashboardNavbarWrapper profile={profile} />
      <main>{children}</main>
      <EsnFooter />
    </>
  )
}
