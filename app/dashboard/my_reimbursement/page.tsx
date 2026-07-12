import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MyExpensesPage from '@/components/MyExpensesPage'
import type { ExpenseCategory, Project } from '@/lib/types'

export default async function MyReimbursementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')
  // NOTE: admin can also have personal reimbursements — do NOT redirect away

  const [{ data: reports }, { data: cats }, { data: projects }] = await Promise.all([
    supabase
      .from('expense_reports')
      .select('*, items:expense_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('expense_categories')
      .select('id, name, max_amount, created_at')
      .order('name'),
    supabase
      .from('projects')
      .select('*, supervisors:project_supervisors(user_id, assigned_at, profiles(id, full_name, section)), allowed_categories:project_allowed_categories(*)')
      .eq('is_active', true)
      .order('name'),
  ])

  const categories: ExpenseCategory[] = cats ?? []

  return (
    <MyExpensesPage
      profile={profile}
      reports={reports ?? []}
      categories={categories}
      projects={(projects ?? []) as Project[]}
    />
  )
}
