import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'board') {
    return NextResponse.json({ error: 'Accesso negato: solo il board può revisionare le richieste' }, { status: 403 })
  }

  const body = await request.json()
  const { status, board_note } = body

  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json(
      { error: 'Status non valido. Valori accettati: approved, rejected' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('expense_requests')
    .update({
      status,
      board_note: board_note ?? null,
      reviewed_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
