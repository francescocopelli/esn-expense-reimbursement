import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardRedirect() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Use adminClient to bypass RLS — consistent with DashboardLayout
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role === 'admin') redirect('/dashboard/admin')
  if (profile?.role === 'board') redirect('/dashboard/review_reimbursement')
  redirect('/dashboard/my_reimbursement')
}
