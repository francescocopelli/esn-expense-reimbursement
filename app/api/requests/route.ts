import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { captureDbError } from '@/lib/sentry'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  Sentry.setUser({ id: user.id })

  let body: unknown
  try {
    body = await request.json()
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'POST /api/requests', step: 'json_parse' } })
    return NextResponse.json({ error: 'Payload non valido' }, { status: 400 })
  }

  const { report_id, notes } = body as { report_id?: string; notes?: string }
  if (!report_id) return NextResponse.json({ error: 'report_id obbligatorio' }, { status: 400 })

  const { data, error } = await supabase
    .from('reimbursement_requests')
    .insert({ report_id, notes, requested_by: user.id })
    .select().single()

  if (error || !data) {
    captureDbError('POST /api/requests insert', error, { userId: user.id, report_id })
    return NextResponse.json({ error: error?.message ?? 'Errore creazione richiesta' }, { status: 500 })
  }

  Sentry.addBreadcrumb({
    category: 'requests',
    message: `Reimbursement request ${data.id} created`,
    level: 'info',
    data: { requestId: data.id, reportId: report_id },
  })

  return NextResponse.json(data, { status: 201 })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  Sentry.setUser({ id: user.id })

  const { data, error } = await supabase
    .from('reimbursement_requests')
    .select('*, report:expense_reports(*)')
    .order('created_at', { ascending: false })

  if (error) {
    captureDbError('GET /api/requests select', error, { userId: user.id })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
