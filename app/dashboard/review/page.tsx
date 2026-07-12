import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BoardDashboard from '@/components/BoardDashboard'

/**
 * /dashboard/review — alias for board members reaching the review page
 * directly (e.g. from a link or navbar).
 * Simply redirects to /dashboard/board which contains the full review UI.
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

  // Only board members can access this page
  if (!profile || profile.role !== 'board') redirect('/dashboard/member')

  const { data: requests } = await supabase
    .from('expense_requests')
    .select('*, profiles(full_name, section)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  return <BoardDashboard profile={profile} requests={requests ?? []} />
}
