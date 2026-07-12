import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface ItemNote {
  id: string
  board_note: string | null
}

interface PatchBody {
  status: string
  board_note?: string
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
  if (!profile || profile.role !== 'board')
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })

  const { id } = await params
  const body = await request.json() as PatchBody

  if (!['approved', 'rejected'].includes(body.status))
    return NextResponse.json({ error: 'Stato non valido' }, { status: 400 })

  // 1. Update the report status
  const { data, error } = await supabase
    .from('expense_reports')
    .update({
      status: body.status,
      board_note: body.board_note ?? null,
      reviewed_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 2. Update per-item board notes (if provided)
  if (body.item_notes && body.item_notes.length > 0) {
    for (const { id: itemId, board_note } of body.item_notes) {
      if (board_note === null || board_note === undefined) continue
      await supabase
        .from('expense_items')
        .update({ board_note })
        .eq('id', itemId)
        .eq('report_id', id) // safety: only update items belonging to this report
    }
  }

  return NextResponse.json(data)
}
