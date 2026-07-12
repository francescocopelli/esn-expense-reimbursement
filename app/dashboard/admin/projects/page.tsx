import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProjectsClient from '@/components/admin/ProjectsClient'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Project } from '@/lib/types'

export default async function AdminProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['board', 'admin'].includes(me.role)) redirect('/dashboard/my_reimbursement')

  const adminClient = createAdminClient()
  const [{ data: projects }, { data: allUsers }, { data: globalCats }] = await Promise.all([
    supabase
      .from('projects')
      .select('*, supervisors:project_supervisors(user_id, assigned_at, profiles(id, full_name, section)), allowed_categories:project_allowed_categories(*)')
      .order('name'),
    adminClient.from('profiles').select('id, full_name, section, role').order('full_name'),
    supabase.from('expense_categories').select('id, name, max_amount').order('name'),
  ])

  return (
    <ProjectsClient
      initialProjects={(projects ?? []) as Project[]}
      allUsers={allUsers ?? []}
      globalCategories={globalCats ?? []}
    />
  )
}
