import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()

  // getSession() reads from cookie — safe after middleware has validated the token
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role === 'admin') redirect('/dashboard/admin')
  if (profile?.role === 'board') redirect('/dashboard/review_reimbursement')
  redirect('/dashboard/my_reimbursement')
}
