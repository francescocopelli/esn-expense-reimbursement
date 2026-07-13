import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import MyExpensesPage from '@/components/MyExpensesPage'
import type { ExpenseCategory, Project } from '@/lib/types'

export default async function MyReimbursementPage() {
  const supabase = await createClient()

  // getUser() verifies the JWT against Supabase Auth server — required after
  // server-side login where cookies may not yet be in the browser's next request.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const admin = createAdminClient()

  const [
    { data: reports },
    { data: cats },
    { data: projects },
  ] = await Promise.all([
    supabase
      .from('expense_reports')
      .select('*, items:expense_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    admin
      .from('expense_categories')
      .select('id, name, max_amount, created_at')
      .order('name'),
    admin
      .from('projects')
      .select('*, supervisors:project_supervisors(user_id, assigned_at, profiles(id, full_name, section)), allowed_categories:project_allowed_categories(*)')
      .eq('is_active', true)
      .order('name'),
  ])

  return (
    <MyExpensesPage
      profile={profile}
      reports={reports ?? []}
      categories={(cats ?? []) as ExpenseCategory[]}
      projects={(projects ?? []) as Project[]}
    />
  )
}
