import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MemberDashboard from '@/components/MemberDashboard'

export default async function MemberPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fallback: if profile is missing, create it from auth metadata
  if (!profile) {
    const metadata = user.user_metadata ?? {}
    const fallbackProfile = {
      id: user.id,
      full_name: metadata.full_name || user.email?.split('@')[0] || 'Utente ESN',
      section: metadata.section || 'ESN Pisa',
      role: metadata.role === 'board' ? 'board' : 'member',
    }

    const { data: inserted } = await supabase
      .from('profiles')
      .upsert(fallbackProfile, { onConflict: 'id' })
      .select('*')
      .single()

    profile = inserted ?? fallbackProfile
  }

  if (profile?.role === 'board') redirect('/dashboard/board')

  const { data: requests } = await supabase
    .from('expense_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <MemberDashboard profile={profile} requests={requests ?? []} />
}
