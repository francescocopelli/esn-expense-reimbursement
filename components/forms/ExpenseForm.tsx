// Server component: fetches categories and active projects from DB, renders the client form
import { createClient } from '@/lib/supabase/server'
import type { ExpenseCategory, Project } from '@/lib/types'
import ExpenseFormClient from './ExpenseFormClient'

export default async function ExpenseForm({ onSuccess }: { onSuccess?: () => void }) {
  const supabase = await createClient()

  const { data: catData } = await supabase
    .from('expense_categories')
    .select('id, name, max_amount, created_at')
    .order('name')
  const categories: ExpenseCategory[] = catData ?? []

  const { data: projData } = await supabase
    .from('projects')
    .select(`
      id, name, description, budget, start_date, end_date, is_active, created_at,
      supervisors:project_supervisors(user_id, profiles(id, full_name, section)),
      allowed_categories:project_allowed_categories(id, category_name, max_amount)
    `)
    .eq('is_active', true)
    .order('name')
  const projects: Project[] = (projData as unknown as Project[]) ?? []

  return <ExpenseFormClient categories={categories} projects={projects} onSuccess={onSuccess} />
}
