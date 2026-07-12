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

  if (profile?.role !== 'board') redirect('/dashboard/member')

  const { data: requests } = await supabase
    .from('expense_requests')
    .select('*, profiles(full_name, section)')
    .order('created_at', { ascending: false })

  return <BoardDashboard profile={profile} requests={requests ?? []} />
}
