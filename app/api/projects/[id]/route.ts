import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

async function requireBoardOrAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autenticato', status: 401, user: null }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['board', 'admin'].includes(profile.role))
    return { error: 'Non autorizzato', status: 403, user: null }
  return { error: null, status: 200, user }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const { id } = await params
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('projects')
    .select(`
      *,
      supervisors:project_supervisors(user_id, assigned_at, profiles(id, full_name, section)),
      allowed_categories:project_allowed_categories(*)
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireBoardOrAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const body = await request.json()
  const { name, description, budget, start_date, end_date, is_active, supervisor_ids, allowed_categories } = body

  if (start_date && end_date && end_date < start_date)
    return NextResponse.json({ error: 'La data di fine deve essere uguale o successiva alla data di inizio' }, { status: 400 })

  const admin = createAdminClient()

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (name        !== undefined) updateData.name        = name.trim()
  if (description !== undefined) updateData.description = description?.trim() || null
  if (budget      !== undefined) updateData.budget      = budget || null
  if (start_date  !== undefined) updateData.start_date  = start_date || null
  if (end_date    !== undefined) updateData.end_date    = end_date   || null
  if (is_active   !== undefined) updateData.is_active   = is_active

  const { data: project, error: pErr } = await admin
    .from('projects').update(updateData).eq('id', id).select().single()
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

  if (supervisor_ids !== undefined) {
    await admin.from('project_supervisors').delete().eq('project_id', id)
    if (supervisor_ids.length > 0) {
      await admin.from('project_supervisors').insert(
        supervisor_ids.map((uid: string) => ({ project_id: id, user_id: uid }))
      )
    }
  }

  if (allowed_categories !== undefined) {
    await admin.from('project_allowed_categories').delete().eq('project_id', id)
    if (allowed_categories.length > 0) {
      await admin.from('project_allowed_categories').insert(
        allowed_categories.map((c: { category_name: string; max_amount: number | null }) => ({
          project_id: id,
          category_name: c.category_name,
          max_amount: c.max_amount ?? null,
        }))
      )
    }
  }

  return NextResponse.json(project)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireBoardOrAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin.from('projects').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
