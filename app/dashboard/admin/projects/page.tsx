import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProjectsClient from '@/components/admin/ProjectsClient'
import { createAdminClient } from '@/lib/supabase/admin'
import * as Sentry from '@sentry/nextjs'
import type { Project } from '@/lib/types'

export default async function AdminProjectsPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  Sentry.addBreadcrumb({
    category: 'page',
    message: 'AdminProjectsPage: getUser',
    level: 'info',
    data: { userId: user?.id ?? null, error: userError?.message ?? null },
  })

  if (!user) redirect('/auth/login')
  Sentry.setUser({ id: user.id })

  // Use adminClient so RLS never blocks the role check
  const adminClient = createAdminClient()
  const { data: me, error: meError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  Sentry.addBreadcrumb({
    category: 'page',
    message: 'AdminProjectsPage: profile fetch',
    level: 'info',
    data: { userId: user.id, role: me?.role ?? null, error: meError?.message ?? null },
  })

  if (!me || !['board', 'admin'].includes(me.role)) redirect('/dashboard/my_reimbursement')

  const [{ data: projects, error: projectsError }, { data: allUsers }, { data: globalCats }] = await Promise.all([
    adminClient
      .from('projects')
      .select('*, supervisors:project_supervisors(user_id, assigned_at, profiles(id, full_name, section)), allowed_categories:project_allowed_categories(*)')
      .order('name'),
    adminClient.from('profiles').select('id, full_name, section, role').order('full_name'),
    adminClient.from('expense_categories').select('id, name, max_amount, created_at').order('name'),
  ])

  Sentry.addBreadcrumb({
    category: 'page',
    message: 'AdminProjectsPage: data fetch',
    level: 'info',
    data: { projectsCount: projects?.length ?? 0, projectsError: projectsError?.message ?? null },
  })

  return (
    <ProjectsClient
      initialProjects={(projects ?? []) as Project[]}
      allUsers={allUsers ?? []}
      globalCategories={globalCats ?? []}
    />
  )
}
