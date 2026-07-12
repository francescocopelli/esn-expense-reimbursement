// Server component: fetches categories from DB, renders the client form
import { createClient } from '@/lib/supabase/server'
import type { ExpenseCategory } from '@/lib/types'
import ExpenseFormClient from './ExpenseFormClient'

export default async function ExpenseForm({ onSuccess }: { onSuccess?: () => void }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('expense_categories')
    .select('id, name, max_amount, created_at')
    .order('name')
  const categories: ExpenseCategory[] = data ?? []
  return <ExpenseFormClient categories={categories} onSuccess={onSuccess} />
}
