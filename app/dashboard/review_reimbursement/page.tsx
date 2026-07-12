import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import BoardDashboard from '@/components/BoardDashboard'
import type { ExpenseReport } from '@/lib/types'

type EnrichedReport = ExpenseReport & { profiles: { full_name: string; section: string } }

export default async function ReviewReimbursementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  if (!profile || (profile.role !== 'board' && profile.role !== 'admin')) {
    // Check if they are a project supervisor
    const { data: supervised } = await supabase
      .from('project_supervisors').select('project_id').eq('user_id', user.id)
    if (!supervised || supervised.length === 0) redirect('/dashboard/my_reimbursement')
  }

  // Use admin client for board/admin so RLS doesn't filter out reports
  const fetchClient = (profile.role === 'board' || profile.role === 'admin')
    ? createAdminClient()
    : supabase

  let reportsQuery = fetchClient
    .from('expense_reports')
    .select('*, items:expense_items(*)')
    .order('created_at', { ascending: false })

  // Supervisors: only see reports for their projects
  if (profile.role !== 'board' && profile.role !== 'admin') {
    const { data: supervised } = await supabase
      .from('project_supervisors').select('project_id').eq('user_id', user.id)
    const projectIds = (supervised ?? []).map((s: any) => s.project_id)
    reportsQuery = reportsQuery.in('project_id', projectIds)
  }

  const { data: reports, error: repError } = await reportsQuery
  if (repError) console.error('[review_reimbursement] fetch error:', repError.message)

  const rows    = (reports ?? []) as ExpenseReport[]
  const userIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)))

  const { data: memberProfiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, section').in('id', userIds)
    : { data: [] as { id: string; full_name: string; section: string }[] }

  const profileMap = Object.fromEntries(
    (memberProfiles ?? []).map(p => [p.id, { full_name: p.full_name, section: p.section }])
  )

  const enrichedReports: EnrichedReport[] = rows.map(r => ({
    ...r,
    profiles: profileMap[r.user_id] ?? { full_name: 'Utente sconosciuto', section: '\u2014' },
  }))

  return <BoardDashboard profile={profile} reports={enrichedReports} />
}
