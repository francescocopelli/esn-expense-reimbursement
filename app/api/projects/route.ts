import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      supervisors:project_supervisors(user_id, assigned_at, profiles(id, full_name, section)),
      allowed_categories:project_allowed_categories(*)
    `)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['board', 'admin'].includes(profile.role))
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })

  const body = await request.json()
  const { name, description, budget, supervisor_ids = [], allowed_categories = [] } = body

  if (!name?.trim())
    return NextResponse.json({ error: 'Nome progetto obbligatorio' }, { status: 400 })

  const { data: project, error: pErr } = await supabase
    .from('projects')
    .insert({ name: name.trim(), description: description?.trim() || null, budget: budget || null, created_by: user.id })
    .select().single()

  if (pErr || !project)
    return NextResponse.json({ error: pErr?.message ?? 'Errore creazione' }, { status: 500 })

  if (supervisor_ids.length > 0) {
    await supabase.from('project_supervisors').insert(
      supervisor_ids.map((uid: string) => ({ project_id: project.id, user_id: uid }))
    )
  }

  if (allowed_categories.length > 0) {
    await supabase.from('project_allowed_categories').insert(
      allowed_categories.map((c: { category_name: string; max_amount: number | null }) => ({
        project_id: project.id,
        category_name: c.category_name,
        max_amount: c.max_amount ?? null,
      }))
    )
  }

  return NextResponse.json(project, { status: 201 })
}
