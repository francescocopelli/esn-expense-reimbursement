import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MyExpensesPage from '@/components/MyExpensesPage'

export default async function MemberPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  if (!profile) redirect('/auth/login')

  const { data: reports } = await supabase
    .from('expense_reports')
    .select('*, items:expense_items(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <MyExpensesPage profile={profile} reports={reports ?? []} />
}
