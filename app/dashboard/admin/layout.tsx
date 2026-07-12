import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminLayoutClient from '@/components/AdminLayoutClient'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, full_name, section').eq('id', user.id).single()

  // Only admin can access the admin panel
  if (!profile || profile.role !== 'admin') redirect('/dashboard/my_reimbursement')

  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
