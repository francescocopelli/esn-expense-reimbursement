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

  const { data, error: dbErr } = await supabase!
    .from('profiles').select('*').order('full_name')
  if (dbErr) {
    captureDbError('GET /api/admin/users select', dbErr)
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const { error, supabase } = await assertAdmin()
  if (error) return error

  let body: unknown
  try { body = await request.json() } catch (err) {
    Sentry.captureException(err, { tags: { route: 'PATCH /api/admin/users', step: 'json_parse' } })
    return NextResponse.json({ error: 'Payload non valido' }, { status: 400 })
  }

  const { id, ...fields } = body as any
  if (!id) return NextResponse.json({ error: 'id obbligatorio' }, { status: 400 })

  const { data, error: dbErr } = await supabase!
    .from('profiles').update(fields).eq('id', id).select().single()

  if (dbErr || !data) {
    captureDbError('PATCH /api/admin/users update', dbErr, { targetUserId: id })
    return NextResponse.json({ error: dbErr?.message ?? 'Errore aggiornamento' }, { status: 500 })
  }

  Sentry.addBreadcrumb({
    category: 'admin',
    message: `User ${id} updated`,
    level: 'info',
    data: { targetUserId: id, fields: Object.keys(fields) },
  })

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const { error, supabase } = await assertAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obbligatorio' }, { status: 400 })

  const { error: dbErr } = await supabase!.from('profiles').delete().eq('id', id)
  if (dbErr) {
    captureDbError('DELETE /api/admin/users', dbErr, { targetUserId: id })
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }

  Sentry.addBreadcrumb({
    category: 'admin',
    message: `User ${id} deleted`,
    level: 'warning',
    data: { targetUserId: id },
  })

  return NextResponse.json({ ok: true })
}
