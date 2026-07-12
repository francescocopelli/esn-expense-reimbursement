import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Non autenticato' }, { status: 401 }), supabase: null }
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!p || p.role !== 'admin') return { error: NextResponse.json({ error: 'Non autorizzato' }, { status: 403 }), supabase: null }
  return { error: null, supabase }
}

export async function PATCH(request: NextRequest) {
  const { error, supabase } = await assertAdmin()
  if (error) return error

  const { id, role } = await request.json()
  if (!['member', 'board', 'admin'].includes(role))
    return NextResponse.json({ error: 'Ruolo non valido' }, { status: 400 })

  const { data, error: dbErr } = await supabase!
    .from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json(data)
}
