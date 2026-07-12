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

export async function GET() {
  const { error, supabase } = await assertAdmin()
  if (error) return error
  const { data } = await supabase!.from('esn_sections').select('*').order('name')
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const { error, supabase } = await assertAdmin()
  if (error) return error
  const { name } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 })
  const { data, error: dbErr } = await supabase!.from('esn_sections').insert({ name: name.trim() }).select().single()
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const { error, supabase } = await assertAdmin()
  if (error) return error
  const { id, name } = await request.json()
  if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 })
  if (!name?.trim()) return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 })
  const { data, error: dbErr } = await supabase!
    .from('esn_sections').update({ name: name.trim() }).eq('id', id).select().single()
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const { error, supabase } = await assertAdmin()
  if (error) return error
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 })
  const { error: dbErr } = await supabase!.from('esn_sections').delete().eq('id', id)
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
