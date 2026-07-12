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

  // Step 1: fetch all requests (board RLS allows this)
  const { data: requests, error: reqError } = await supabase
    .from('expense_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (reqError) console.error('[board] fetch requests error:', reqError.message)

  const rows = requests ?? []

  // Step 2: batch-fetch profiles for all unique user_ids referenced
  // Array.from(new Set(...)) is used instead of [...new Set(...)] for ES5 compat
  const userIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)))

  const { data: memberProfiles, error: profError } = userIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, full_name, section')
        .in('id', userIds)
    : { data: [], error: null }

  if (profError) console.error('[board] fetch profiles error:', profError.message)

  const profileMap = Object.fromEntries(
    (memberProfiles ?? []).map(p => [p.id, { full_name: p.full_name, section: p.section }])
  )

  // Step 3: merge profiles into requests (same shape as PostgREST join)
  const enrichedRequests = rows.map(r => ({
    ...r,
    profiles: profileMap[r.user_id] ?? { full_name: 'Utente sconosciuto', section: '\u2014' },
  }))

  return <BoardDashboard profile={profile} requests={enrichedRequests} />
}
