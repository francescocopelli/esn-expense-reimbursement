import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AdminLayoutClient from '@/components/AdminLayoutClient'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, full_name, section').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard/board')

  return <AdminLayoutClient profile={profile}>{children}</AdminLayoutClient>
}
