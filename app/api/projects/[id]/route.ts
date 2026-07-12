import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function requireBoardOrAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
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
  const { data, error } = await supabase
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
  const supabase = await createClient()
  const auth = await requireBoardOrAdmin(supabase)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const body = await request.json()
  const { name, description, budget, is_active, supervisor_ids, allowed_categories } = body

  // Update project fields
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (name !== undefined) updateData.name = name.trim()
  if (description !== undefined) updateData.description = description?.trim() || null
  if (budget !== undefined) updateData.budget = budget || null
  if (is_active !== undefined) updateData.is_active = is_active

  const { data: project, error: pErr } = await supabase
    .from('projects').update(updateData).eq('id', id).select().single()
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

  // Replace supervisors if provided
  if (supervisor_ids !== undefined) {
    await supabase.from('project_supervisors').delete().eq('project_id', id)
    if (supervisor_ids.length > 0) {
      await supabase.from('project_supervisors').insert(
        supervisor_ids.map((uid: string) => ({ project_id: id, user_id: uid }))
      )
    }
  }

  // Replace allowed_categories if provided
  if (allowed_categories !== undefined) {
    await supabase.from('project_allowed_categories').delete().eq('project_id', id)
    if (allowed_categories.length > 0) {
      await supabase.from('project_allowed_categories').insert(
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
  const supabase = await createClient()
  const auth = await requireBoardOrAdmin(supabase)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
