import { createClient } from '@/lib/supabase/server'
import UsersClient from '@/components/admin/UsersClient'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, section, role, created_at')
    .order('full_name')

  return <UsersClient initialUsers={users ?? []} />
}
