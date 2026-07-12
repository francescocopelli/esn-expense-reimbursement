import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UsersClient from '@/components/admin/UsersClient'

export default async function AdminUsersPage() {
  // Double-check caller is admin (layout already guards, but belt-and-suspenders)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || me.role !== 'admin') redirect('/dashboard/my_reimbursement')

  // Use service-role client to bypass RLS and fetch ALL profiles
  const adminClient = createAdminClient()
  const { data: users } = await adminClient
    .from('profiles')
    .select('id, full_name, section, role, created_at, updated_at')
    .order('full_name')

  return <UsersClient initialUsers={users ?? []} />
}
