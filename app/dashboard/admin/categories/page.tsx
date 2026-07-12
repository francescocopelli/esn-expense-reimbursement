import { createClient } from '@/lib/supabase/server'
import CategoriesClient from '@/components/admin/CategoriesClient'

export default async function AdminCategoriesPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('expense_categories').select('*').order('name')

  return <CategoriesClient initialCategories={categories ?? []} />
}
