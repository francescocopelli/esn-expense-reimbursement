import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BoardDashboard from '@/components/BoardDashboard'

/**
 * /dashboard/review — mostra solo le richieste in attesa al board.
 * Usa fetch in due step per evitare problemi di RLS sui join FK di PostgREST.
 */
export default async function ReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'board') redirect('/dashboard/member')

  // Step 1: solo richieste pending
  const { data: requests, error: reqError } = await supabase
    .from('expense_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (reqError) console.error('[review] fetch requests error:', reqError.message)

  const rows = requests ?? []

  // Step 2: batch-fetch profili
  const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))]

  const { data: memberProfiles, error: profError } = userIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, full_name, section')
        .in('id', userIds)
    : { data: [], error: null }

  if (profError) console.error('[review] fetch profiles error:', profError.message)

  const profileMap = Object.fromEntries(
    (memberProfiles ?? []).map(p => [p.id, { full_name: p.full_name, section: p.section }])
  )

  const enrichedRequests = rows.map(r => ({
    ...r,
    profiles: profileMap[r.user_id] ?? { full_name: 'Utente sconosciuto', section: '—' },
  }))

  return <BoardDashboard profile={profile} requests={enrichedRequests} />
}
