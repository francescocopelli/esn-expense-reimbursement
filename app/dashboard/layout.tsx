import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardNavbarWrapper from '@/components/DashboardNavbarWrapper'
import EsnFooter from '@/components/EsnFooter'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  if (!profile) redirect('/auth/login')

  return (
    <>
      <DashboardNavbarWrapper profile={profile} />
      <main>{children}</main>
      <EsnFooter />
    </>
  )
}
