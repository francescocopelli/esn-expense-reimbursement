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
  const { data, error: dbErr } = await supabase!.from('expense_categories').select('*').order('name')
  if (dbErr) { captureDbError('GET /api/admin/categories', dbErr); return NextResponse.json({ error: dbErr.message }, { status: 500 }) }
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const { error, supabase } = await assertAdmin()
  if (error) return error
  let body: unknown
  try { body = await request.json() } catch (err) {
    Sentry.captureException(err, { tags: { route: 'POST /api/admin/categories' } })
    return NextResponse.json({ error: 'Payload non valido' }, { status: 400 })
  }
  const { name, max_amount } = body as any
  if (!name) return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 })
  const { data, error: dbErr } = await supabase!.from('expense_categories').insert({ name, max_amount }).select().single()
  if (dbErr || !data) { captureDbError('POST /api/admin/categories insert', dbErr, { name }); return NextResponse.json({ error: dbErr?.message }, { status: 500 }) }
  Sentry.addBreadcrumb({ category: 'admin', message: `Category created: ${name}`, level: 'info' })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const { error, supabase } = await assertAdmin()
  if (error) return error
  let body: unknown
  try { body = await request.json() } catch (err) {
    Sentry.captureException(err, { tags: { route: 'PATCH /api/admin/categories' } })
    return NextResponse.json({ error: 'Payload non valido' }, { status: 400 })
  }
  const { id, ...fields } = body as any
  if (!id) return NextResponse.json({ error: 'id obbligatorio' }, { status: 400 })
  const { data, error: dbErr } = await supabase!.from('expense_categories').update(fields).eq('id', id).select().single()
  if (dbErr || !data) { captureDbError('PATCH /api/admin/categories update', dbErr, { id }); return NextResponse.json({ error: dbErr?.message }, { status: 500 }) }
  Sentry.addBreadcrumb({ category: 'admin', message: `Category ${id} updated`, level: 'info', data: { id, fields: Object.keys(fields) } })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const { error, supabase } = await assertAdmin()
  if (error) return error
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obbligatorio' }, { status: 400 })
  const { error: dbErr } = await supabase!.from('expense_categories').delete().eq('id', id)
  if (dbErr) { captureDbError('DELETE /api/admin/categories', dbErr, { id }); return NextResponse.json({ error: dbErr.message }, { status: 500 }) }
  Sentry.addBreadcrumb({ category: 'admin', message: `Category ${id} deleted`, level: 'warning', data: { id } })
  return NextResponse.json({ ok: true })
}
