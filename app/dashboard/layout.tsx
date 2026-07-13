import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardNavbarWrapper from '@/components/DashboardNavbarWrapper'
import EsnFooter from '@/components/EsnFooter'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // Use getSession() — reads from cookie without extra network round-trip.
  // The middleware already validated the session via getUser(); here we just
  // need the user ID to fetch the profile.
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', session.user.id).single()

  if (!profile) redirect('/auth/login')

  return (
    <>
      <DashboardNavbarWrapper profile={profile} />
      <main>{children}</main>
      <EsnFooter />
    </>
  )
}
