import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminLayoutClient from '@/components/AdminLayoutClient'
import * as Sentry from '@sentry/nextjs'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  Sentry.addBreadcrumb({
    category: 'layout',
    message: 'AdminLayout: getUser',
    level: 'info',
    data: { userId: user?.id ?? null, error: userError?.message ?? null },
  })

  if (!user) {
    Sentry.captureMessage('[ESN] AdminLayout: unauthenticated', {
      level: 'warning',
      tags: { context: 'admin_layout' },
    })
    redirect('/auth/login')
  }

  // Use adminClient to bypass RLS — anon client returns null profile under Edge cookie context
  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles').select('role, full_name, section').eq('id', user!.id).single()

  Sentry.addBreadcrumb({
    category: 'layout',
    message: 'AdminLayout: profile fetch',
    level: 'info',
    data: {
      userId: user!.id,
      role: profile?.role ?? null,
      found: !!profile,
      errorCode: profileError?.code ?? null,
      errorMessage: profileError?.message ?? null,
    },
  })

  if (!profile) {
    Sentry.captureMessage('[ESN] AdminLayout: profile not found', {
      level: 'error',
      extra: {
        userId: user!.id,
        errorCode: profileError?.code,
        errorMessage: profileError?.message,
        errorHint: profileError?.hint,
      },
      tags: { context: 'admin_layout', event: 'profile_missing' },
    })
    redirect('/auth/login')
  }

  if (profile!.role !== 'admin') {
    Sentry.captureMessage('[ESN] AdminLayout: access denied (not admin)', {
      level: 'warning',
      extra: { userId: user!.id, role: profile!.role },
      tags: { context: 'admin_layout', event: 'access_denied' },
    })
    redirect('/dashboard/my_reimbursement')
  }

  Sentry.setUser({ id: user!.id })
  Sentry.addBreadcrumb({
    category: 'layout',
    message: 'AdminLayout: access granted',
    level: 'info',
    data: { userId: user!.id },
  })

  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
