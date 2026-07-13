import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

  const isBoardOrAdmin = profile?.role === 'board' || profile?.role === 'admin'

  if (!profile || !isBoardOrAdmin) {
    // Check project supervisor access
    const adminClient = createAdminClient()
    const { data: supervised } = await adminClient
      .from('project_supervisors').select('project_id').eq('user_id', user.id)
    if (!supervised || supervised.length === 0) redirect('/dashboard/my_reimbursement')
  }

  if (!profile) redirect('/auth/login')

  // Use admin client so board/admin/supervisor can fetch any report
  const adminClient = createAdminClient()

  const { data: report } = await adminClient
    .from('expense_reports')
    .select('*, items:expense_items(*)')
    .eq('id', id)
    .single()

  if (!report) notFound()

  // Verify supervisor scope: if not board/admin, report must belong to one of their projects
  if (!isBoardOrAdmin) {
    const { data: supervised } = await adminClient
      .from('project_supervisors').select('project_id').eq('user_id', user.id)
    const projectIds = (supervised ?? []).map((s: any) => s.project_id)
    if (!report.project_id || !projectIds.includes(report.project_id)) notFound()
  }

  const { data: submitter } = await adminClient
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
