import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import MyExpensesPage from '@/components/MyExpensesPage'
import type { ExpenseCategory, Project } from '@/lib/types'

export default async function MyReimbursementPage() {
  // Auth via user client
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  // Use admin client for tables without RLS policies (projects, expense_categories)
  const admin = createAdminClient()

  const [
    { data: reports },
    { data: cats },
    { data: projects },
  ] = await Promise.all([
    // expense_reports: user owns these — RLS allows reading own rows
    supabase
      .from('expense_reports')
      .select('*, items:expense_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    // expense_categories: no RLS — use admin
    admin
      .from('expense_categories')
      .select('id, name, max_amount, created_at')
      .order('name'),
    // projects: no RLS — use admin
    admin
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
