import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import MyExpensesPage from '@/components/MyExpensesPage'
import type { ExpenseCategory, Project } from '@/lib/types'
import * as Sentry from '@sentry/nextjs'

export default async function MyReimbursementPage() {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (!user) {
    console.error('[my_reimbursement] getUser failed:', userError?.message)
    redirect('/auth/login')
  }

  const admin = createAdminClient()

  // Use adminClient for profiles to bypass any RLS that might block the read
  const { data: profile, error: profileError } = await admin
    .from('profiles').select('*').eq('id', user!.id).single()

  if (profileError || !profile) {
    Sentry.captureMessage('[ESN] Profile not found after login', {
      level: 'error',
      extra: {
        userId: user!.id,
        errorCode: profileError?.code,
        errorMessage: profileError?.message,
        errorDetails: profileError?.details,
        errorHint: profileError?.hint,
      },
      tags: { context: 'my_reimbursement', event: 'profile_missing' },
    })
    console.error('[my_reimbursement] profile query failed:', profileError)
    // Show error page instead of redirect loop
    throw new Error(
      `Profilo utente non trovato (id=${user!.id}). ` +
      `Errore DB: ${profileError?.message ?? 'nessun risultato'}. ` +
      `Hint: ${profileError?.hint ?? '-'}`
    )
  }

  const [
    { data: reports },
    { data: cats },
    { data: projects },
  ] = await Promise.all([
    supabase
      .from('expense_reports')
      .select('*, items:expense_items(*)')
      .eq('user_id', user!.id)
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
