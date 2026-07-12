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

  // Admin layout handles its own navbar inside AdminLayoutClient
  // We still render the layout shell but skip navbar for /dashboard/admin/*
  // by delegating to AdminLayoutClient (which already has EsnNavbar).
  // For all other roles we inject the shared navbar here.
  const isAdmin = profile.role === 'admin'

  return (
    <>
      {!isAdmin && <DashboardNavbarWrapper profile={profile} />}
      <main>{children}</main>
      {!isAdmin && <EsnFooter />}
    </>
  )
}
