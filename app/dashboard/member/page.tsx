import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MemberDashboard from '@/components/MemberDashboard'

export default async function MemberPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'board') redirect('/dashboard/board')

  const { data: requests } = await supabase
    .from('expense_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <MemberDashboard profile={profile} requests={requests ?? []} />
}
