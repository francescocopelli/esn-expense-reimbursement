import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ReviewDetailClient from '@/components/ReviewDetailClient'

export default async function ReviewReimbursementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  if (!profile || (profile.role !== 'board' && profile.role !== 'admin')) {
    redirect('/dashboard/my_reimbursement')
  }

  const { data: report } = await supabase
    .from('expense_reports')
    .select('*, items:expense_items(*)')
    .eq('id', id)
    .single()

  if (!report) notFound()

  const { data: submitter } = await supabase
    .from('profiles').select('full_name, section').eq('id', report.user_id).single()

  return (
    <div className="container" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6c757d' }}>
        <Link href="/dashboard/review_reimbursement" style={{ color: '#0d6efd', textDecoration: 'none' }}>
          ← Torna alla lista
        </Link>
      </div>
      <ReviewDetailClient
        report={report}
        submitter={submitter ?? { full_name: 'Sconosciuto', section: '—' }}
        reviewerName={profile.full_name}
      />
    </div>
  )
}
