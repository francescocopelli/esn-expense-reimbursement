import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import BoardDashboard from '@/components/BoardDashboard'
import type { ExpenseReport } from '@/lib/types'
import * as Sentry from '@sentry/nextjs'

type EnrichedReport = ExpenseReport & { profiles: { full_name: string; section: string } }

export default async function ReviewReimbursementPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  Sentry.addBreadcrumb({
    category: 'page',
    message: 'ReviewReimbursementPage: getUser',
    level: 'info',
    data: { userId: user?.id ?? null, error: userError?.message ?? null },
  })

  if (!user) {
    Sentry.captureMessage('[ESN] ReviewPage: unauthenticated', { level: 'warning', tags: { context: 'review_page' } })
    redirect('/auth/login')
  }

  // Always use adminClient to bypass RLS
  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles').select('*').eq('id', user!.id).single()

  Sentry.addBreadcrumb({
    category: 'page',
    message: 'ReviewReimbursementPage: profile fetch',
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
    Sentry.captureMessage('[ESN] ReviewPage: profile not found', {
      level: 'error',
      extra: { userId: user!.id, errorCode: profileError?.code, errorMessage: profileError?.message, errorHint: profileError?.hint },
      tags: { context: 'review_page', event: 'profile_missing' },
    })
    redirect('/auth/login')
  }

  const isBoardOrAdmin = profile!.role === 'board' || profile!.role === 'admin'

  Sentry.addBreadcrumb({
    category: 'page',
    message: `ReviewPage: role=${profile!.role} isBoardOrAdmin=${isBoardOrAdmin}`,
    level: 'info',
    data: { userId: user!.id, role: profile!.role },
  })

  if (!isBoardOrAdmin) {
    // Check if supervisor
    const { data: supervised, error: supErr } = await admin
      .from('project_supervisors').select('project_id').eq('user_id', user!.id)

    Sentry.addBreadcrumb({
      category: 'page',
      message: `ReviewPage: supervisor check`,
      level: 'info',
      data: { userId: user!.id, supervisedCount: supervised?.length ?? 0, error: supErr?.message ?? null },
    })

    if (!supervised || supervised.length === 0) {
      Sentry.captureMessage('[ESN] ReviewPage: access denied (not board/admin/supervisor)', {
        level: 'warning',
        extra: { userId: user!.id, role: profile!.role },
        tags: { context: 'review_page', event: 'access_denied' },
      })
      redirect('/dashboard/my_reimbursement')
    }
  }

  const fetchClient = isBoardOrAdmin ? admin : supabase

  let reportsQuery = fetchClient
    .from('expense_reports')
    .select('*, items:expense_items(*)')
    .order('created_at', { ascending: false })

  if (!isBoardOrAdmin) {
    const { data: supervised } = await admin
      .from('project_supervisors').select('project_id').eq('user_id', user!.id)
    const projectIds = (supervised ?? []).map((s: any) => s.project_id)
    reportsQuery = reportsQuery.in('project_id', projectIds)

    Sentry.addBreadcrumb({
      category: 'page',
      message: `ReviewPage: supervisor filtering by ${projectIds.length} projects`,
      level: 'info',
      data: { projectIds },
    })
  }

  const { data: reports, error: repError } = await reportsQuery

  Sentry.addBreadcrumb({
    category: 'page',
    message: `ReviewPage: reports fetched`,
    level: 'info',
    data: { count: reports?.length ?? 0, error: repError?.message ?? null },
  })

  if (repError) {
    Sentry.captureMessage('[ESN] ReviewPage: reports fetch error', {
      level: 'error',
      extra: { errorMessage: repError.message, errorCode: repError.code },
      tags: { context: 'review_page', event: 'reports_fetch_error' },
    })
  }

  const rows    = (reports ?? []) as ExpenseReport[]
  const userIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)))

  const { data: memberProfiles, error: mpError } = userIds.length > 0
    ? await admin.from('profiles').select('id, full_name, section').in('id', userIds)
    : { data: [] as { id: string; full_name: string; section: string }[], error: null }

  Sentry.addBreadcrumb({
    category: 'page',
    message: `ReviewPage: member profiles fetched`,
    level: 'info',
    data: { requested: userIds.length, found: memberProfiles?.length ?? 0, error: mpError?.message ?? null },
  })

  const profileMap = Object.fromEntries(
    (memberProfiles ?? []).map(p => [p.id, { full_name: p.full_name, section: p.section }])
  )

  const enrichedReports: EnrichedReport[] = rows.map(r => ({
    ...r,
    profiles: profileMap[r.user_id] ?? { full_name: 'Utente sconosciuto', section: '\u2014' },
  }))

  Sentry.setUser({ id: user!.id })
  Sentry.addBreadcrumb({
    category: 'page',
    message: `ReviewPage: rendering with ${enrichedReports.length} reports`,
    level: 'info',
  })

  return <BoardDashboard profile={profile!} reports={enrichedReports} />
}
