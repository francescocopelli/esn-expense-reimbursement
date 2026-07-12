import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BoardDashboard from '@/components/BoardDashboard'

export default async function BoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'board') redirect('/dashboard/member')

  // Step 1: fetch all reports
  const { data: reports, error: repError } = await supabase
    .from('expense_reports')
    .select('*, expense_items(*)')
    .order('created_at', { ascending: false })

  if (repError) console.error('[board] fetch reports error:', repError.message)

  const rows = reports ?? []

  // Step 2: batch-fetch profiles for all unique user_ids
  const userIds = Array.from(new Set(rows.map((r: { user_id: string }) => r.user_id).filter(Boolean)))

  const { data: memberProfiles } = userIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, full_name, section')
        .in('id', userIds)
    : { data: [] }

  const profileMap = Object.fromEntries(
    (memberProfiles ?? []).map((p: { id: string; full_name: string; section: string }) => [p.id, { full_name: p.full_name, section: p.section }])
  )

  const enrichedReports = rows.map((r: Record<string, unknown>) => ({
    ...r,
    profiles: profileMap[r.user_id as string] ?? { full_name: 'Utente sconosciuto', section: '\u2014' },
  }))

  return <BoardDashboard profile={profile} reports={enrichedReports} />
}
