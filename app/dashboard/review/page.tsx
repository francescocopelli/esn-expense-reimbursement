import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BoardDashboard from '@/components/BoardDashboard'
import type { ExpenseReport } from '@/lib/types'

type EnrichedReport = ExpenseReport & { profiles: { full_name: string; section: string } }

export default async function ReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  if (!profile || (profile.role !== 'board' && profile.role !== 'admin')) {
    redirect('/dashboard/member')
  }

  // Carica TUTTI i report (board vede tutto via RLS, admin anche)
  const { data: reports, error: repError } = await supabase
    .from('expense_reports')
    .select('*, items:expense_items(*)')
    .order('created_at', { ascending: false })

  if (repError) console.error('[review] fetch reports error:', repError.message)

  const rows = (reports ?? []) as ExpenseReport[]
  const userIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)))

  const { data: memberProfiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, section').in('id', userIds)
    : { data: [] as { id: string; full_name: string; section: string }[] }

  const profileMap = Object.fromEntries(
    (memberProfiles ?? []).map(p => [p.id, { full_name: p.full_name, section: p.section }])
  )

  const enrichedReports: EnrichedReport[] = rows.map(r => ({
    ...r,
    profiles: profileMap[r.user_id] ?? { full_name: 'Utente sconosciuto', section: '—' },
  }))

  return <BoardDashboard profile={profile} reports={enrichedReports} />
}
