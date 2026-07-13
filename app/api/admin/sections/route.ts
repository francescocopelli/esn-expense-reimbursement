import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { captureDbError } from '@/lib/sentry'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Non autenticato' }, { status: 401 }), supabase: null }
  Sentry.setUser({ id: user.id })
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin')
    return { error: NextResponse.json({ error: 'Accesso negato' }, { status: 403 }), supabase: null }
  return { error: null, supabase: admin }
}

export async function GET() {
  const { error, supabase } = await assertAdmin()
  if (error) return error
  const { data, error: dbErr } = await supabase!.from('esn_sections').select('*').order('name')
  if (dbErr) { captureDbError('GET /api/admin/sections', dbErr); return NextResponse.json({ error: dbErr.message }, { status: 500 }) }
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const { error, supabase } = await assertAdmin()
  if (error) return error
  let body: unknown
  try { body = await request.json() } catch (err) {
    Sentry.captureException(err, { tags: { route: 'POST /api/admin/sections' } })
    return NextResponse.json({ error: 'Payload non valido' }, { status: 400 })
  }
  const { name, city } = body as any
  if (!name) return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 })
  const { data, error: dbErr } = await supabase!.from('esn_sections').insert({ name, city }).select().single()
  if (dbErr || !data) { captureDbError('POST /api/admin/sections insert', dbErr, { name }); return NextResponse.json({ error: dbErr?.message }, { status: 500 }) }
  Sentry.addBreadcrumb({ category: 'admin', message: `Section created: ${name}`, level: 'info' })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const { error, supabase } = await assertAdmin()
  if (error) return error
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obbligatorio' }, { status: 400 })
  const { error: dbErr } = await supabase!.from('esn_sections').delete().eq('id', id)
  if (dbErr) { captureDbError('DELETE /api/admin/sections', dbErr, { id }); return NextResponse.json({ error: dbErr.message }, { status: 500 }) }
  Sentry.addBreadcrumb({ category: 'admin', message: `Section ${id} deleted`, level: 'warning', data: { id } })
  return NextResponse.json({ ok: true })
}
