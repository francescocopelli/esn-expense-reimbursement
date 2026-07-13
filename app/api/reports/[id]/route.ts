import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

interface ItemNote {
  id: string
  board_note: string | null
}

interface PatchBody {
  status: string
  board_note?: string | null
  item_notes?: ItemNote[]
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'board' && profile.role !== 'admin'))
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })

  const { id } = await params
  const body = await request.json() as PatchBody

  const VALID_STATUSES = ['approved', 'rejected', 'needs_info']
  if (!VALID_STATUSES.includes(body.status))
    return NextResponse.json({ error: 'Stato non valido' }, { status: 400 })

  // Use admin client to fetch the report (bypass RLS for board role)
  const adminClient = createAdminClient()
  const { data: existing } = await adminClient
    .from('expense_reports').select('id, project_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Rimborso non trovato' }, { status: 404 })

  // Board: verify they are not trying to approve a report outside their scope.
  // Admin can approve any report. Board can approve any (global scope by design).
  // Supervisor: not handled here (PATCH is board/admin only — checked above).

  const integration_note =
    body.status === 'needs_info' ? (body.board_note ?? null) : null

  const { data, error } = await adminClient
    .from('expense_reports')
    .update({
      status:           body.status,
      board_note:       body.board_note ?? null,
      integration_note,
      reviewed_by:      user.id,
      reviewed_at:      new Date().toISOString(),
      updated_at:       new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (body.item_notes?.length) {
    for (const { id: itemId, board_note } of body.item_notes) {
      if (board_note === null || board_note === undefined) continue
      await adminClient
        .from('expense_items')
        .update({ board_note })
        .eq('id', itemId)
        .eq('report_id', id)
    }
  }

  return NextResponse.json(data)
}
